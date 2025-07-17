// src/utils/api.js

// ================================================================
// ATENÇÃO: COLOQUE O DOMÍNIO DA SUA API AQUI
// Em um projeto real, usaria process.env.NEXT_PUBLIC_API_URL
// ================================================================
const API_BASE_URL = 'https://jackbear-sms.r954jc.easypanel.host';

/**
 * Função utilitária para fazer requisições autenticadas à API.
 * @param {string} endpoint - O endpoint da API (ex: '/api/credits/balance').
 * @param {string} method - O método HTTP (GET, POST, PUT, DELETE).
 * @param {Object} body - O corpo da requisição (para POST/PUT).
 * @param {string} token - O token JWT de autenticação.
 * @returns {Promise<Object>} - A resposta da API.
 * @throws {Error} - Lança um erro se a requisição falhar ou a API retornar erro.
 */
export async function authenticatedFetch(endpoint, method = 'GET', body = null, token) {
  if (!token) {
    throw new Error('Token de autenticação não fornecido.');
  }

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };

  const options = {
    method,
    headers,
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
    const data = await response.json();

    if (!response.ok || !data.success) {
      // Lança um erro com a mensagem da API ou uma mensagem padrão
      const errorMessage = data.message || 'Ocorreu um erro na requisição.';
      throw new Error(errorMessage);
    }

    return data.data; // Retorna apenas a parte 'data' da resposta de sucesso
  } catch (error) {
    console.error(`Erro em ${method} ${endpoint}:`, error.message);
    throw error; // Propaga o erro para ser tratado no componente
  }
}