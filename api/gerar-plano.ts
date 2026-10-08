import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';

/**
 * Schema de saída estruturada para o Gemini (Structured Outputs)
 */
const planoSchema = {
  type: SchemaType.OBJECT,
  properties: {
    plano_semanal: {
      type: SchemaType.ARRAY,
      description: 'Lista de 7 dias com o plano alimentar semanal',
      items: {
        type: SchemaType.OBJECT,
        properties: {
          dia: {
            type: SchemaType.STRING,
            description: 'Nome do dia da semana (ex: Segunda-feira)',
          },
          refeicoes: {
            type: SchemaType.OBJECT,
            properties: {
              cafe_da_manha: {
                type: SchemaType.ARRAY,
                items: { type: SchemaType.STRING },
                description: 'Exatamente 5 opções variadas de café da manhã',
              },
              lanche_manha: {
                type: SchemaType.ARRAY,
                items: { type: SchemaType.STRING },
                description: 'Exatamente 5 opções variadas de lanche da manhã',
              },
              almoco: {
                type: SchemaType.ARRAY,
                items: { type: SchemaType.STRING },
                description: 'Exatamente 5 opções variadas de almoço',
              },
              lanche_tarde: {
                type: SchemaType.ARRAY,
                items: { type: SchemaType.STRING },
                description: 'Exatamente 5 opções variadas de lanche da tarde',
              },
              jantar: {
                type: SchemaType.ARRAY,
                items: { type: SchemaType.STRING },
                description: 'Exatamente 5 opções variadas de jantar',
              },
            },
            required: [
              'cafe_da_manha',
              'lanche_manha',
              'almoco',
              'lanche_tarde',
              'jantar',
            ],
          },
        },
        required: ['dia', 'refeicoes'],
      },
    },
  },
  required: ['plano_semanal'],
};

/**
 * Constrói o texto detalhado dos dados do paciente para o prompt do Gemini
 */
function formatarDadosPaciente(paciente: any): string {
  if (!paciente) return 'Nenhum dado informado.';
  if (typeof paciente === 'string') return paciente;

  const partes: string[] = [];

  if (paciente.nome) partes.push(`Nome: ${paciente.nome}`);
  if (paciente.idade) partes.push(`Idade: ${paciente.idade} anos`);
  if (paciente.sexo) partes.push(`Sexo: ${paciente.sexo}`);
  if (paciente.peso || paciente.peso_inicial)
    partes.push(`Peso: ${paciente.peso || paciente.peso_inicial} kg`);
  if (paciente.altura) partes.push(`Altura: ${paciente.altura} cm`);

  const objetivos = Array.isArray(paciente.objetivos)
    ? paciente.objetivos.filter(Boolean).join(', ')
    : paciente.objetivos || '';
  if (objetivos || paciente.objetivo_texto) {
    partes.push(
      `Objetivos: ${[objetivos, paciente.objetivo_texto].filter(Boolean).join(' - ')}`
    );
  }

  if (paciente.nivel_atividade)
    partes.push(`Nível de Atividade Física: ${paciente.nivel_atividade}`);

  const patologias = Array.isArray(paciente.patologias)
    ? paciente.patologias.filter(Boolean).join(', ')
    : paciente.patologias;
  if (patologias) partes.push(`Patologias: ${patologias}`);

  const restricoes = Array.isArray(paciente.restricoes_alimentares || paciente.restricoes)
    ? (paciente.restricoes_alimentares || paciente.restricoes).filter(Boolean).join(', ')
    : (paciente.restricoes_alimentares || paciente.restricoes);
  if (restricoes) partes.push(`Restrições Alimentares: ${restricoes}`);

  const alergias = Array.isArray(paciente.alergias)
    ? paciente.alergias.filter(Boolean).join(', ')
    : paciente.alergias;
  if (alergias) partes.push(`Alergias: ${alergias}`);

  if (paciente.medicamentos) partes.push(`Medicamentos: ${paciente.medicamentos}`);
  if (paciente.suplementos) partes.push(`Suplementos: ${paciente.suplementos}`);
  if (paciente.refeicoes_por_dia)
    partes.push(`Refeições por dia desejadas: ${paciente.refeicoes_por_dia}`);
  if (paciente.horario_acorda || paciente.horario_dorme) {
    partes.push(
      `Rotina de sono: Acorda às ${paciente.horario_acorda || 'N/D'} | Dorme às ${paciente.horario_dorme || 'N/D'}`
    );
  }
  if (paciente.litros_agua) partes.push(`Consumo de água: ${paciente.litros_agua}L/dia`);
  if (paciente.atividade_fisica_descricao)
    partes.push(`Detalhes da atividade física: ${paciente.atividade_fisica_descricao}`);
  if (paciente.observacoes) partes.push(`Observações adicionais: ${paciente.observacoes}`);

  return partes.join('\n');
}

/**
 * Lê o corpo da requisição caso seja stream puro (Node HTTP)
 */
async function getRequestBody(req: any): Promise<any> {
  if (req.body) {
    if (typeof req.body === 'string') {
      try {
        return JSON.parse(req.body);
      } catch {
        return {};
      }
    }
    return req.body;
  }

  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk: Buffer | string) => {
      raw += chunk;
    });
    req.on('end', () => {
      if (!raw.trim()) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error('Corpo da requisição inválido (JSON malformatado).'));
      }
    });
    req.on('error', (err: any) => reject(err));
  });
}

/**
 * Helper unificado para enviar resposta JSON compatível com Vercel e Connect/Vite
 */
function sendJson(res: any, statusCode: number, data: any) {
  if (typeof res.status === 'function') {
    return res.status(statusCode).json(data);
  }
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(data));
}

/**
 * Serverless function handler principal para /api/gerar-plano
 */
export default async function handler(req: any, res: any) {
  // Configuração de CORS se necessário
  if (res.setHeader) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }

  if (req.method === 'OPTIONS') {
    if (typeof res.status === 'function') return res.status(200).end();
    res.statusCode = 200;
    return res.end();
  }

  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'Método não permitido. Utilize POST.' });
  }

  // 1. Validação de Segurança das Chaves de API
  const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('ERRO: GOOGLE_API_KEY ou GEMINI_API_KEY não definida no ambiente.');
    return sendJson(res, 500, {
      error:
        'A chave de API do Gemini (GOOGLE_API_KEY) não está configurada no servidor.',
    });
  }

  try {
    // 2. Extração do payload da requisição
    const body = await getRequestBody(req);
    const dadosPacienteFormatados = formatarDadosPaciente(
      body.paciente || body.dados_do_paciente || body
    );

    // 3. Montagem do prompt interno conforme regras do Prompt 6
    const promptInterno = `Você é um nutricionista clínico profissional especialista na culinária e rotina brasileira.
Gere um plano alimentar semanal completo, saudável e diversificado com base nos dados do paciente fornecidos abaixo.

Dados do Paciente (Metas, Alergias, Restrições e Histórico):
${dadosPacienteFormatados}

# Regras Críticas de Execução:
- Você deve responder APENAS e estritamente o objeto JSON solicitado.
- Não inclua blocos de código markdown (como \`\`\`json ... \`\`\`), explicações, introduções ou textos complementares.
- Adapte o cardápio rigorosamente a quaisquer alergias ou restrições descritas nos dados.
- Utilize alimentos comuns, acessíveis e culturalmente aceitos no Brasil.
- Evite repetições monótonas de alimentos nos dias seguidos.

O formato do JSON retornado deve seguir exatamente esta estrutura:
{
  "plano_semanal": [
    {
      "dia": "Segunda-feira",
      "refeicoes": {
        "cafe_da_manha": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"],
        "lanche_manha": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"],
        "almoco": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"],
        "lanche_tarde": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"],
        "jantar": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"]
      }
    }
  ]
}`;

    // 4. Inicialização do Google Gen AI SDK
    const genAI = new GoogleGenerativeAI(apiKey);

    // Modelos ativos suportados pela API com fallback e prioridade para os mais rápidos e disponíveis
    const modelosParaTentar = [
      process.env.GEMINI_MODEL,
      'gemini-3.5-flash',
      'gemini-3.7-flash',
      'gemini-3.8-flash',
      'gemini-flash-latest',
    ].filter(Boolean) as string[];

    const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    let responseText = '';
    let lastError: any = null;

    for (const modelName of modelosParaTentar) {
      // Tenta até 2 vezes se for erro temporário de sobrecarga (503 Service Unavailable)
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          console.log(`[API /api/gerar-plano] Tentando modelo ${modelName} (tentativa ${attempt})...`);
          const model = genAI.getGenerativeModel({
            model: modelName,
            generationConfig: {
              responseMimeType: 'application/json',
              responseSchema: planoSchema as any,
              temperature: 0.7,
            },
          });

          const result = await model.generateContent(promptInterno);
          responseText = result.response.text();
          if (responseText) {
            console.log(`[API /api/gerar-plano] Sucesso com modelo ${modelName}!`);
            break;
          }
        } catch (err: any) {
          lastError = err;
          const msg = err?.message || String(err);
          const is503 = msg.includes('503') || msg.includes('high demand') || msg.includes('Service Unavailable');
          console.warn(`[API /api/gerar-plano] Modelo ${modelName} falhou:`, msg.slice(0, 160));

          if (is503 && attempt === 1) {
            console.log(`[API /api/gerar-plano] 503 detectado, aguardando 1.5s para retry no modelo ${modelName}...`);
            await sleep(1500);
            continue;
          }
          break; // Passa para o próximo modelo se não for retry de 503
        }
      }

      if (responseText) break;
    }

    if (!responseText) {
      throw lastError || new Error('Nenhuma resposta retornada pelos modelos do Gemini.');
    }

    // 5. Validação com try/catch e sanitização de JSON
    let parsedJson: any;
    try {
      // Limpeza de potenciais delimitadores markdown caso ocorra anomalia
      let sanitized = responseText.trim();
      if (sanitized.startsWith('```json')) {
        sanitized = sanitized.replace(/^```json\s*/i, '').replace(/\s*```$/, '');
      } else if (sanitized.startsWith('```')) {
        sanitized = sanitized.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      parsedJson = JSON.parse(sanitized);
    } catch (parseErr) {
      console.error('Falha ao processar JSON da IA:', parseErr, 'Texto recebido:', responseText);
      return sendJson(res, 502, {
        error: 'A IA respondeu em formato não reconhecido.',
        detalhes: responseText,
      });
    }

    if (!parsedJson || !Array.isArray(parsedJson.plano_semanal)) {
      return sendJson(res, 502, {
        error: 'Estrutura inválida retornada pela IA (plano_semanal não encontrado).',
        dadosRecebidos: parsedJson,
      });
    }

    // Retorna o JSON estruturado gerado com sucesso
    return sendJson(res, 200, parsedJson);
  } catch (error: any) {
    console.error('Erro ao executar /api/gerar-plano:', error);
    const mensagemErro = error?.message || 'Erro interno ao comunicar com o Gemini.';
    return sendJson(res, 500, {
      error: 'Não foi possível gerar o plano com IA no momento.',
      detalhes: mensagemErro,
    });
  }
}
