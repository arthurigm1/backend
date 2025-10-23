import { ICriarEmpresa } from "../../interface/Empresa/Empresa";
import { EmpresaModel } from "../../models/Empresa/EmpresaModel";
import { NotificacaoModel } from "../../models/Notificacao/NotificacaoModel";
import { ApiError } from "../../utils/apiError";

const empresaModel = new EmpresaModel();
const notificacaoModel = new NotificacaoModel();

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

  async buscarInquilinosInadimplentes(
    empresaId: string,
    filtros?: {
      lojaId?: string;
      inquilinoId?: string;
      q?: string;
      page?: number;
      limit?: number;
    }
  ) {
    const { lojaId, inquilinoId, q, page = 1, limit = 10 } = filtros || {};

    // Validar paginação
    if (page < 1) {
      throw new ApiError(400, "Página deve ser maior que 0");
    }
    if (limit < 1 || limit > 100) {
      throw new ApiError(400, "Limite deve estar entre 1 e 100");
    }

    // Buscar faturas vencidas
    const faturasVencidas = await notificacaoModel.buscarFaturasVencidas();
    
    // Filtrar por empresa
    const faturasEmpresa = faturasVencidas.filter(f => f.contrato.inquilino.empresaId === empresaId);
    
    // Aplicar filtros
    let faturasFiltradasSet = new Set();
    
    for (const fatura of faturasEmpresa) {
      const inquilino = fatura.contrato.inquilino;
      const loja = fatura.contrato.loja;
      
      // Filtro por loja
      if (lojaId && loja.id !== lojaId) continue;
      
      // Filtro por inquilino específico
      if (inquilinoId && inquilino.id !== inquilinoId) continue;
      
      // Filtro por busca (nome ou email)
      if (q) {
        const busca = q.toLowerCase();
        const nomeMatch = inquilino.nome.toLowerCase().includes(busca);
        const emailMatch = inquilino.email?.toLowerCase().includes(busca);
        if (!nomeMatch && !emailMatch) continue;
      }
      
      // Adicionar inquilino único ao set
      const vencimento = fatura.dataVencimento ? new Date(fatura.dataVencimento) : undefined;
      const diasEmAtraso = vencimento ? Math.max(0, Math.floor((Date.now() - vencimento.getTime()) / (1000 * 60 * 60 * 24))) : undefined;
      faturasFiltradasSet.add(JSON.stringify({
        nome: inquilino.nome,
        email: inquilino.email,
        telefone: inquilino.telefone,
        lojaNome: loja.nome,
        valorFatura: fatura.valorAluguel,
        vencimento,
        diasEmAtraso
      }));
    }
    
    // Converter set para array e parsear
    const inquilinosUnicos = Array.from(faturasFiltradasSet).map(item => JSON.parse(item as string));
    
    // Aplicar paginação
    const totalRegistros = inquilinosUnicos.length;
    const totalPaginas = Math.ceil(totalRegistros / limit);
    const offset = (page - 1) * limit;
    const inquilinosPaginados = inquilinosUnicos.slice(offset, offset + limit);
    
    return {
      inquilinos: inquilinosPaginados,
      paginacao: {
        paginaAtual: page,
        totalPaginas,
        totalRegistros,
        limite: limit,
        temProximaPagina: page < totalPaginas,
        temPaginaAnterior: page > 1
      },
      filtros: {
        lojaId,
        inquilinoId,
        q
      }
    };
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