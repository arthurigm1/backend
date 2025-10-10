import { ICriarLoja, IVincularInquilino } from "../../interface/Loja/Loja";
import { LojaModel } from "../../models/Loja/LojaModel";
import { UsuarioModel } from "../../models/Usuario/UsuarioModel";
import { ApiError } from "../../utils/apiError";

const lojaModel = new LojaModel();
const usuarioModel = new UsuarioModel();

export class LojaService {
  async criarLoja(data: ICriarLoja, usuarioId: string) {
    // Verificar se o usuário pertence à empresa
    const usuarioLogado = await usuarioModel.buscarPorId(usuarioId);
    const usuarioValido = await usuarioModel.verificarSeUsuarioPertenceEmpresa(usuarioId, data.empresaId);
    if (!usuarioValido) {
      throw new ApiError(403, "Você não tem permissão para criar lojas nesta empresa");
    }
    if (usuarioLogado?.tipo === "VISITANTE" || usuarioLogado?.tipo === "INQUILINO") {
      throw new ApiError(403, "Voce não tem permissao para criar lojas");
    }
    // Verificar se já existe uma loja com este número na empresa
    const lojaExistente = await lojaModel.buscarPorNumero(data.numero, data.empresaId);
    if (lojaExistente) {
      throw new ApiError(400, "Já existe uma loja com este número nesta empresa");
    }

    const loja = await lojaModel.criarLoja(data);
    return loja;
  }

  async listarLojasDaEmpresa(empresaId: string, usuarioId: string, page?: number, limit?: number) {
    const usuarioLogado = await usuarioModel.buscarPorId(usuarioId);
    if (usuarioLogado?.tipo === "VISITANTE" || usuarioLogado?.tipo === "INQUILINO") {
      throw new ApiError(403, "Voce não tem permissao para visualizar lojas");
    }
    // Verificar se o usuário pertence à empresa
    const usuarioValido = await usuarioModel.verificarSeUsuarioPertenceEmpresa(usuarioId, empresaId);
    if (!usuarioValido) {
      throw new ApiError(403, "Você não tem permissão para visualizar lojas desta empresa");
    }

    return await lojaModel.listarLojasDaEmpresa(empresaId, page, limit);
  }
  async listarLojas(empresaId: string, usuarioId: string, filtros: any, page: number, limit: number) {
    const usuarioLogado = await usuarioModel.buscarPorId(usuarioId);
    if (usuarioLogado?.tipo === "VISITANTE" || usuarioLogado?.tipo === "INQUILINO") {
      throw new ApiError(403, "Voce não tem permissao para visualizar lojas");
    }
    // Verificar se o usuário pertence à empresa pelo token JWT
    const usuarioValido = await usuarioModel.verificarSeUsuarioPertenceEmpresa(usuarioId, empresaId);
    if (!usuarioValido) {
      throw new ApiError(403, "Você não tem permissão para visualizar lojas desta empresa");
    }

    return await lojaModel.listarLojas(empresaId, filtros, page, limit);
  }

  async buscarLojaPorId(id: string, usuarioId: string, empresaId: string) {
    const usuarioLogado = await usuarioModel.buscarPorId(usuarioId);
    if (usuarioLogado?.tipo === "VISITANTE" || usuarioLogado?.tipo === "INQUILINO") {
      throw new ApiError(403, "Voce não tem permissao para visualizar lojas");
    }
    // Verificar se o usuário pertence à empresa
    const usuarioValido = await usuarioModel.verificarSeUsuarioPertenceEmpresa(usuarioId, empresaId);
    if (!usuarioValido) {
      throw new ApiError(403, "Você não tem permissão para visualizar lojas desta empresa");
    }

    const loja = await lojaModel.buscarPorId(id);
    if (!loja) {
      throw new ApiError(404, "Loja não encontrada");
    }

    // Verificar se a loja pertence à empresa do usuário
    if (loja.empresaId !== empresaId) {
      throw new ApiError(403, "Esta loja não pertence à sua empresa");
    }

    return loja;
  }



  async atualizarStatusLoja(id: string, status: 'VAGA' | 'OCUPADA' | 'INATIVA', usuarioId: string) {
    const usuarioLogado = await usuarioModel.buscarPorId(usuarioId);
    if (usuarioLogado?.tipo === "VISITANTE" || usuarioLogado?.tipo === "INQUILINO") {
      throw new ApiError(403, "Voce não tem permissao para visualizar lojas");
    }
    const loja = await lojaModel.buscarPorId(id);
    if (!loja) {
      throw new ApiError(404, "Loja não encontrada");
    }

    const usuarioValido = await usuarioModel.verificarSeUsuarioPertenceEmpresa(usuarioId, loja.empresaId);
    if (!usuarioValido) {
      throw new ApiError(403, "Você não tem permissão para gerenciar esta loja");
    }

    return await lojaModel.atualizarStatus(id, status);
  }

  async editarLoja(id: string, data: any, usuarioId: string, empresaId: string) {
    const usuarioLogado = await usuarioModel.buscarPorId(usuarioId);
    if (usuarioLogado?.tipo === "VISITANTE" || usuarioLogado?.tipo === "INQUILINO") {
      throw new ApiError(403, "Voce não tem permissao para visualizar lojas");
    }
    // Verificar se a loja existe
    const loja = await lojaModel.buscarPorId(id);
    if (!loja) {
      throw new ApiError(404, "Loja não encontrada");
    }

    // Verificar se o usuário pertence à empresa da loja
    const usuarioValido = await usuarioModel.verificarSeUsuarioPertenceEmpresa(usuarioId, loja.empresaId);
    if (!usuarioValido) {
      throw new ApiError(403, "Você não tem permissão para editar esta loja");
    }

    // Verificar se a loja pertence à empresa do usuário
    if (loja.empresaId !== empresaId) {
      throw new ApiError(403, "Esta loja não pertence à sua empresa");
    }

    // Se está alterando o número, verificar se já existe outro com o mesmo número
    if (data.numero && data.numero !== loja.numero) {
      const lojaExistente = await lojaModel.buscarPorNumero(data.numero, empresaId);
      if (lojaExistente) {
        throw new ApiError(400, "Já existe uma loja com este número nesta empresa");
      }
    }

    // Se está vinculando inquilino
    if (data.vincularInquilino) {
      // Verificar se o inquilino existe e é do tipo INQUILINO
      const inquilino = await usuarioModel.buscarPorId(data.vincularInquilino.inquilinoId);
      if (!inquilino) {
        throw new ApiError(404, "Inquilino não encontrado");
      }

      if (inquilino.tipo !== 'INQUILINO') {
        throw new ApiError(400, "O usuário selecionado não é um inquilino");
      }

      // Verificar se o inquilino pertence à mesma empresa
      if (inquilino.empresaId !== empresaId) {
        throw new ApiError(400, "O inquilino deve pertencer à mesma empresa da loja");
      }
    }

    return await lojaModel.editarLoja(id, data);
  }

  async desativarLoja(id: string, usuarioId: string, empresaId: string) {
    const usuarioLogado = await usuarioModel.buscarPorId(usuarioId);
    if (usuarioLogado?.tipo === "VISITANTE" || usuarioLogado?.tipo === "INQUILINO") {
      throw new ApiError(403, "Voce não tem permissao para visualizar lojas");
    }
    // Verificar se o usuário pertence à empresa
    const usuarioValido = await usuarioModel.verificarSeUsuarioPertenceEmpresa(usuarioId, empresaId);
    if (!usuarioValido) {
      throw new ApiError(403, "Você não tem permissão para desativar lojas desta empresa");
    }

    // Verificar se a loja existe e pertence à empresa
    const loja = await lojaModel.buscarPorId(id);
    if (!loja) {
      throw new ApiError(404, "Loja não encontrada");
    }

    if (loja.empresaId !== empresaId) {
      throw new ApiError(403, "Você não tem permissão para desativar esta loja");
    }

    // Verificar se a loja já está inativa
    if (loja.status === 'INATIVA') {
      throw new ApiError(400, "A loja já está inativa");
    }

    // Desativar a loja (alterar status para INATIVA)
    return await lojaModel.desativarLoja(id);
  }

  async desvincularInquilino(id: string, usuarioId: string, empresaId: string) {
    const usuarioLogado = await usuarioModel.buscarPorId(usuarioId);
    if (usuarioLogado?.tipo === "VISITANTE" || usuarioLogado?.tipo === "INQUILINO") {
      throw new ApiError(403, "Voce não tem permissao para visualizar lojas");
    }
    // Verificar se a loja existe e pertence à empresa
    const loja = await lojaModel.buscarPorId(id);
    if (!loja) {
      throw new ApiError(404, "Loja não encontrada");
    }

    if (loja.empresaId !== empresaId) {
      throw new ApiError(403, "Você não tem permissão para acessar esta loja");
    }

    // Verificar se há inquilino vinculado
    if (!loja.usuarioId) {
      throw new ApiError(400, "Não há inquilino vinculado a esta loja");
    }

    return await lojaModel.desvincularInquilino(id);
  }
}