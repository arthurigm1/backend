import { ICriarLoja, IVincularInquilino } from "../../interface/Loja/Loja";
import { LojaModel } from "../../models/Loja/LojaModel";
import { UsuarioModel } from "../../models/Usuario/UsuarioModel";
import { ApiError } from "../../utils/apiError";

const lojaModel = new LojaModel();
const usuarioModel = new UsuarioModel();

export class LojaService {
  async criarLoja(data: ICriarLoja, usuarioId: string) {
    // Verificar se o usuário pertence à empresa
    const usuarioValido = await usuarioModel.verificarSeUsuarioPertenceEmpresa(usuarioId, data.empresaId);
    if (!usuarioValido) {
      throw new ApiError(403, "Você não tem permissão para criar lojas nesta empresa");
    }

    // Verificar se já existe uma loja com este número na empresa
    const lojaExistente = await lojaModel.buscarPorNumero(data.numero, data.empresaId);
    if (lojaExistente) {
      throw new ApiError(400, "Já existe uma loja com este número nesta empresa");
    }

    const loja = await lojaModel.criarLoja(data);
    return loja;
  }

  async listarLojasDaEmpresa(empresaId: string, usuarioId: string) {
    // Verificar se o usuário pertence à empresa
    const usuarioValido = await usuarioModel.verificarSeUsuarioPertenceEmpresa(usuarioId, empresaId);
    if (!usuarioValido) {
      throw new ApiError(403, "Você não tem permissão para visualizar lojas desta empresa");
    }

    return await lojaModel.listarLojasDaEmpresa(empresaId);
  }

  async buscarLojaPorId(id: string, usuarioId: string) {
    const loja = await lojaModel.buscarPorId(id);
    if (!loja) {
      throw new ApiError(404, "Loja não encontrada");
    }

    // Verificar se o usuário pertence à empresa da loja
    const usuarioValido = await usuarioModel.verificarSeUsuarioPertenceEmpresa(usuarioId, loja.empresaId);
    if (!usuarioValido) {
      throw new ApiError(403, "Você não tem permissão para visualizar esta loja");
    }

    return loja;
  }

  async vincularInquilino(data: IVincularInquilino, usuarioId: string) {
    // Verificar se a loja existe e pertence à empresa do usuário
    const loja = await lojaModel.buscarPorId(data.lojaId);
    if (!loja) {
      throw new ApiError(404, "Loja não encontrada");
    }

    const usuarioValido = await usuarioModel.verificarSeUsuarioPertenceEmpresa(usuarioId, loja.empresaId);
    if (!usuarioValido) {
      throw new ApiError(403, "Você não tem permissão para gerenciar esta loja");
    }

    // Verificar se a loja está disponível
    if (loja.status === 'OCUPADA') {
      throw new ApiError(400, "Esta loja já está ocupada");
    }

    if (loja.status === 'INATIVA') {
      throw new ApiError(400, "Esta loja está inativa e não pode ser alugada");
    }

    // Verificar se o inquilino existe e é do tipo INQUILINO
    const inquilino = await usuarioModel.buscarPorId(data.inquilinoId);
    if (!inquilino) {
      throw new ApiError(404, "Inquilino não encontrado");
    }

    if (inquilino.tipo !== 'INQUILINO') {
      throw new ApiError(400, "O usuário selecionado não é um inquilino");
    }

    // Verificar se o inquilino pertence à mesma empresa
    if (inquilino.empresaId !== loja.empresaId) {
      throw new ApiError(400, "O inquilino deve pertencer à mesma empresa da loja");
    }

    // Verificar se o inquilino já possui contrato ativo
    const contratoAtivo = await this.verificarContratoAtivoInquilino(data.inquilinoId);
    if (contratoAtivo) {
      throw new ApiError(400, "Este inquilino já possui um contrato ativo");
    }

    const contrato = await lojaModel.vincularInquilino(data);
    return contrato;
  }

  private async verificarContratoAtivoInquilino(inquilinoId: string): Promise<boolean> {
    const contrato = await usuarioModel.buscarContratoAtivoInquilino(inquilinoId);
    return !!contrato;
  }

  async atualizarStatusLoja(id: string, status: 'VAGA' | 'OCUPADA' | 'INATIVA', usuarioId: string) {
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
}