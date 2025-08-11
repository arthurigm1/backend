import { ICriarEmpresa } from "../../interface/Empresa/Empresa";
import { EmpresaModel } from "../../models/Empresa/EmpresaModel";
import { ApiError } from "../../utils/apiError";

const empresaModel = new EmpresaModel();

export class EmpresaService {
  async criarEmpresa(data: ICriarEmpresa) {
    // Verificar se já existe uma empresa com este CNPJ
    const empresaExistente = await empresaModel.buscarPorCnpj(data.cnpj);
    if (empresaExistente) {
      throw new ApiError(400, "Já existe uma empresa cadastrada com este CNPJ");
    }

    // Validar formato do CNPJ (básico)
    if (!this.validarCNPJ(data.cnpj)) {
      throw new ApiError(400, "CNPJ inválido");
    }

    const empresa = await empresaModel.criarEmpresa(data);
    return empresa;
  }

  async buscarEmpresaPorCnpj(cnpj: string) {
    const empresa = await empresaModel.buscarPorCnpj(cnpj);
    if (!empresa) {
      throw new ApiError(404, "Empresa não encontrada");
    }
    return empresa;
  }

  async buscarEmpresaPorId(id: string) {
    const empresa = await empresaModel.buscarPorId(id);
    if (!empresa) {
      throw new ApiError(404, "Empresa não encontrada");
    }
    return empresa;
  }

  async listarEmpresas() {
    return await empresaModel.listarEmpresas();
  }

  private validarCNPJ(cnpj: string): boolean {
    // Remove caracteres não numéricos
    const cnpjLimpo = cnpj.replace(/[^\d]/g, '');
    
    // Verifica se tem 14 dígitos
    if (cnpjLimpo.length !== 14) {
      return false;
    }

    // Verifica se não são todos os dígitos iguais
    if (/^(\d)\1{13}$/.test(cnpjLimpo)) {
      return false;
    }

    // Validação básica dos dígitos verificadores
    let soma = 0;
    let peso = 2;
    
    // Primeiro dígito verificador
    for (let i = 11; i >= 0; i--) {
      soma += parseInt(cnpjLimpo[i]) * peso;
      peso = peso === 9 ? 2 : peso + 1;
    }
    
    let digito1 = soma % 11 < 2 ? 0 : 11 - (soma % 11);
    if (parseInt(cnpjLimpo[12]) !== digito1) {
      return false;
    }
    
    // Segundo dígito verificador
    soma = 0;
    peso = 2;
    for (let i = 12; i >= 0; i--) {
      soma += parseInt(cnpjLimpo[i]) * peso;
      peso = peso === 9 ? 2 : peso + 1;
    }
    
    let digito2 = soma % 11 < 2 ? 0 : 11 - (soma % 11);
    return parseInt(cnpjLimpo[13]) === digito2;
  }
}