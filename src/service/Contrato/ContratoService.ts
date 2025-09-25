import { 
  ICriarContrato, 
  IAtualizarContrato, 
  IFiltrosContrato 
} from "../../interface/Contrato/Contrato";
import { ContratoModel } from "../../models/Contrato/ContratoModel";
import { UsuarioModel } from "../../models/Usuario/UsuarioModel";
import { LojaModel } from "../../models/Loja/LojaModel";
import { ApiError } from "../../utils/apiError";
import { StatusContrato, StatusLoja } from "../../generated/prisma";

const contratoModel = new ContratoModel();
const usuarioModel = new UsuarioModel();
const lojaModel = new LojaModel();

export class ContratoService {
  async criarContrato(data: ICriarContrato, usuarioId: string) {
    // Verificar se a loja existe
    const loja = await lojaModel.buscarPorId(data.lojaId);
    if (!loja) {
      throw new ApiError(404, "Loja não encontrada");
    }

    // Verificar se o usuário pertence à empresa da loja
    const usuarioValido = await usuarioModel.verificarSeUsuarioPertenceEmpresa(usuarioId, loja.empresaId);
    if (!usuarioValido) {
      throw new ApiError(403, "Você não tem permissão para criar contratos nesta empresa");
    }

    // Verificar se o inquilino existe
    const inquilino = await usuarioModel.buscarPorId(data.inquilinoId);
    if (!inquilino) {
      throw new ApiError(404, "Inquilino não encontrado");
    }

    // Verificar se já existe um contrato ativo para esta loja
    const contratoAtivo = await contratoModel.listarContratos({
      lojaId: data.lojaId,
      status: StatusContrato.ATIVO,
      ativo: true
    });

    if (Array.isArray(contratoAtivo) && contratoAtivo.length > 0) {
      throw new ApiError(400, "Já existe um contrato ativo para esta loja");
    }

    // Validar datas
    if (data.dataFim <= data.dataInicio) {
      throw new ApiError(400, "A data de fim deve ser posterior à data de início");
    }

    // Validar valor do aluguel
    if (data.valorAluguel <= 0) {
      throw new ApiError(400, "O valor do aluguel deve ser maior que zero");
    }

    // Validar percentual de reajuste se fornecido
    if (data.percentualReajuste !== undefined && data.percentualReajuste < 0) {
      throw new ApiError(400, "O percentual de reajuste não pode ser negativo");
    }

    const contrato = await contratoModel.criarContrato(data);

    // Atualizar status da loja para OCUPADA
    await lojaModel.atualizarStatus(data.lojaId, StatusLoja.OCUPADA);

    return contrato;
  }

  async listarContratosDaEmpresa(
    empresaId: string, 
    usuarioId: string, 
    filtros: IFiltrosContrato = {},
    page?: number, 
    limit?: number
  ) {
    // Verificar se o usuário pertence à empresa
    const usuarioValido = await usuarioModel.verificarSeUsuarioPertenceEmpresa(usuarioId, empresaId);
    if (!usuarioValido) {
      throw new ApiError(403, "Você não tem permissão para visualizar contratos desta empresa");
    }

    return await contratoModel.listarContratosPorEmpresa(empresaId, filtros, page, limit);
  }

  async buscarContratoPorId(id: string, usuarioId: string) {
    const contrato = await contratoModel.buscarPorId(id);
    if (!contrato) {
      throw new ApiError(404, "Contrato não encontrado");
    }

    // Verificar se o usuário pertence à empresa da loja do contrato
    const loja = await lojaModel.buscarPorId(contrato.lojaId);
    if (!loja) {
      throw new ApiError(404, "Loja do contrato não encontrada");
    }

    const usuarioValido = await usuarioModel.verificarSeUsuarioPertenceEmpresa(usuarioId, loja.empresaId);
    if (!usuarioValido) {
      throw new ApiError(403, "Você não tem permissão para visualizar este contrato");
    }

    return contrato;
  }

  async atualizarContrato(id: string, data: IAtualizarContrato, usuarioId: string) {
    const contrato = await contratoModel.buscarPorId(id);
    if (!contrato) {
      throw new ApiError(404, "Contrato não encontrado");
    }

    // Verificar se o usuário pertence à empresa da loja do contrato
    const loja = await lojaModel.buscarPorId(contrato.lojaId);
    if (!loja) {
      throw new ApiError(404, "Loja do contrato não encontrada");
    }

    const usuarioValido = await usuarioModel.verificarSeUsuarioPertenceEmpresa(usuarioId, loja.empresaId);
    if (!usuarioValido) {
      throw new ApiError(403, "Você não tem permissão para atualizar este contrato");
    }

    // Validações específicas
    if (data.valorAluguel !== undefined && data.valorAluguel <= 0) {
      throw new ApiError(400, "O valor do aluguel deve ser maior que zero");
    }

    if (data.percentualReajuste !== undefined && data.percentualReajuste < 0) {
      throw new ApiError(400, "O percentual de reajuste não pode ser negativo");
    }

    if (data.dataFim !== undefined) {
      const dataInicio = new Date(contrato.dataInicio);
      if (data.dataFim <= dataInicio) {
        throw new ApiError(400, "A data de fim deve ser posterior à data de início");
      }
    }

    const contratoAtualizado = await contratoModel.atualizarContrato(id, data);

    // Se o status foi alterado para RESCINDIDO ou VENCIDO, atualizar status da loja
    if (data.status && (data.status === StatusContrato.RESCINDIDO || data.status === StatusContrato.VENCIDO)) {
      await lojaModel.atualizarStatus(contrato.lojaId, StatusLoja.VAGA);
    }

    return contratoAtualizado;
  }

  async deletarContrato(id: string, usuarioId: string) {
    const contrato = await contratoModel.buscarPorId(id);
    if (!contrato) {
      throw new ApiError(404, "Contrato não encontrado");
    }

    // Verificar se o usuário pertence à empresa da loja do contrato
    const loja = await lojaModel.buscarPorId(contrato.lojaId);
    if (!loja) {
      throw new ApiError(404, "Loja do contrato não encontrada");
    }

    const usuarioValido = await usuarioModel.verificarSeUsuarioPertenceEmpresa(usuarioId, loja.empresaId);
    if (!usuarioValido) {
      throw new ApiError(403, "Você não tem permissão para deletar este contrato");
    }

    await contratoModel.deletarContrato(id);

    // Atualizar status da loja para VAGA
    await lojaModel.atualizarStatus(contrato.lojaId, StatusLoja.VAGA);

    return { message: "Contrato deletado com sucesso" };
  }

  async rescindirContrato(id: string, usuarioId: string, observacoes?: string) {
    const contrato = await contratoModel.buscarPorId(id);
    if (!contrato) {
      throw new ApiError(404, "Contrato não encontrado");
    }

    if (contrato.status !== StatusContrato.ATIVO) {
      throw new ApiError(400, "Apenas contratos ativos podem ser rescindidos");
    }

    // Verificar se o usuário pertence à empresa da loja do contrato
    const loja = await lojaModel.buscarPorId(contrato.lojaId);
    if (!loja) {
      throw new ApiError(404, "Loja do contrato não encontrada");
    }

    const usuarioValido = await usuarioModel.verificarSeUsuarioPertenceEmpresa(usuarioId, loja.empresaId);
    if (!usuarioValido) {
      throw new ApiError(403, "Você não tem permissão para rescindir este contrato");
    }

    const dadosAtualizacao: IAtualizarContrato = {
      status: StatusContrato.RESCINDIDO,
      ativo: false
    };

    if (observacoes) {
      dadosAtualizacao.observacoes = observacoes;
    }

    const contratoAtualizado = await contratoModel.atualizarContrato(id, dadosAtualizacao);

    // Atualizar status da loja para VAGA
    await lojaModel.atualizarStatus(contrato.lojaId, StatusLoja.VAGA);

    return contratoAtualizado;
  }

  async renovarContrato(id: string, novaDataFim: Date, usuarioId: string, novoValor?: number) {
    const contrato = await contratoModel.buscarPorId(id);
    if (!contrato) {
      throw new ApiError(404, "Contrato não encontrado");
    }

    // Verificar se o usuário pertence à empresa da loja do contrato
    const loja = await lojaModel.buscarPorId(contrato.lojaId);
    if (!loja) {
      throw new ApiError(404, "Loja do contrato não encontrada");
    }

    const usuarioValido = await usuarioModel.verificarSeUsuarioPertenceEmpresa(usuarioId, loja.empresaId);
    if (!usuarioValido) {
      throw new ApiError(403, "Você não tem permissão para renovar este contrato");
    }

    // Validar nova data de fim
    if (novaDataFim <= new Date()) {
      throw new ApiError(400, "A nova data de fim deve ser futura");
    }

    const dadosAtualizacao: IAtualizarContrato = {
      dataFim: novaDataFim,
      status: StatusContrato.ATIVO,
      ativo: true
    };

    if (novoValor !== undefined) {
      if (novoValor <= 0) {
        throw new ApiError(400, "O novo valor do aluguel deve ser maior que zero");
      }
      dadosAtualizacao.valorAluguel = novoValor;
    }

    return await contratoModel.atualizarContrato(id, dadosAtualizacao);
  }

  async buscarContratosVencendoEm(dias: number) {
    return await contratoModel.buscarContratosVencendoEm(dias);
  }

  async buscarContratosVencidos() {
    return await contratoModel.buscarContratosVencidos();
  }

  async atualizarStatusContratosVencidos() {
    return await contratoModel.atualizarStatusContratosVencidos();
  }

  async buscarUsuariosEmpresaPorContrato(contratoId: string) {
    return await contratoModel.buscarUsuariosEmpresaPorContrato(contratoId);
  }
}