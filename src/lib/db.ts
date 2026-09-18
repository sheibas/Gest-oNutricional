import { neon } from '@neondatabase/serverless';

const databaseUrl = import.meta.env.VITE_DATABASE_URL || '';

export const sql = databaseUrl ? neon(databaseUrl) : null;

export interface Nutricionista {
  id: string;
  nome: string;
  email: string;
  created_at?: string;
}

export interface PacienteSemRetorno {
  paciente_id: string;
  paciente_nome: string;
  paciente_email: string | null;
  paciente_whatsapp: string | null;
  paciente_sexo: string | null;
  paciente_peso_inicial: number | null;
  ultima_consulta_data: string;
  dias_sem_consulta: number;
}

export interface DashboardStats {
  totalPacientes: number;
  consultasSemana: number;
  pacientesSemRetorno: PacienteSemRetorno[];
}

export interface Paciente {
  id: string;
  nutricionista_id: string;
  nome: string;
  data_nascimento?: string | null;
  sexo?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  peso_inicial?: number | null;
  altura?: number | null;
  objetivos?: string[] | null;
  objetivo_texto?: string | null;
  nivel_atividade?: string | null;
  patologias?: string[] | null;
  restricoes_alimentares?: string[] | null;
  alergias?: string[] | null;
  medicamentos?: string | null;
  suplementos?: string | null;
  refeicoes_por_dia?: number | null;
  horario_acorda?: string | null;
  horario_dorme?: string | null;
  litros_agua?: number | null;
  atividade_fisica?: boolean | null;
  atividade_fisica_descricao?: string | null;
  observacoes?: string | null;
  created_at?: string;
}

export interface Consulta {
  id: string;
  paciente_id: string;
  data_consulta: string;
  peso?: number | null;
  cintura?: number | null;
  quadril?: number | null;
  percentual_gordura?: number | null;
  observacoes?: string | null;
  proximo_retorno?: string | null;
  created_at?: string;
}

/**
 * Obtém ou cadastra o nutricionista logado na tabela nutricionistas do Neon
 */
export async function getOrCreateNutricionista(email: string, nome?: string): Promise<Nutricionista | null> {
  if (!sql) {
    console.warn('VITE_DATABASE_URL não configurada.');
    return null;
  }

  try {
    const existing = await sql`
      SELECT id, nome, email, created_at 
      FROM nutricionistas 
      WHERE email = ${email} 
      LIMIT 1
    `;

    if (existing && existing.length > 0) {
      return existing[0] as Nutricionista;
    }

    const inserted = await sql`
      INSERT INTO nutricionistas (nome, email)
      VALUES (${nome || email.split('@')[0]}, ${email})
      ON CONFLICT (email) DO UPDATE 
      SET nome = EXCLUDED.nome
      RETURNING id, nome, email, created_at
    `;

    if (inserted && inserted.length > 0) {
      return inserted[0] as Nutricionista;
    }
  } catch (error) {
    console.error('Erro ao buscar/criar nutricionista:', error);
  }

  return null;
}

/**
 * Sincroniza o nutricionista (mantido para compatibilidade de auth)
 */
export async function syncNutricionista(nome: string, email: string) {
  return getOrCreateNutricionista(email, nome);
}

/**
 * Carrega as estatísticas do Dashboard em tempo real do Neon
 */
export async function getDashboardStats(nutricionistaId: string): Promise<DashboardStats> {
  if (!sql || !nutricionistaId) {
    return {
      totalPacientes: 0,
      consultasSemana: 0,
      pacientesSemRetorno: [],
    };
  }

  try {
    // 1. Total de pacientes ativos cadastrados pelo nutricionista
    const pacientesCountResult = await sql`
      SELECT count(*)::int as total
      FROM pacientes
      WHERE nutricionista_id = ${nutricionistaId}
    `;
    const totalPacientes = pacientesCountResult[0]?.total ? Number(pacientesCountResult[0].total) : 0;

    // 2. Consultas da semana atual do nutricionista
    const consultasSemanaResult = await sql`
      SELECT count(c.id)::int as total
      FROM consultas c
      JOIN pacientes p ON c.paciente_id = p.id
      WHERE p.nutricionista_id = ${nutricionistaId}
        AND c.data_consulta >= date_trunc('week', CURRENT_DATE)::date
        AND c.data_consulta <= (date_trunc('week', CURRENT_DATE) + interval '6 days')::date
    `;
    const consultasSemana = consultasSemanaResult[0]?.total ? Number(consultasSemanaResult[0].total) : 0;

    // 3. Pacientes sem retorno: última consulta há mais de 30 dias e sem próximo retorno agendado
    const semRetornoResult = await sql`
      WITH ultimas_consultas AS (
        SELECT 
          p.id as paciente_id,
          p.nome as paciente_nome,
          p.email as paciente_email,
          p.whatsapp as paciente_whatsapp,
          p.sexo as paciente_sexo,
          p.peso_inicial as paciente_peso_inicial,
          MAX(c.data_consulta) as ultima_consulta_data,
          MAX(c.proximo_retorno) FILTER (WHERE c.proximo_retorno >= CURRENT_DATE) as proximo_retorno_futuro
        FROM pacientes p
        JOIN consultas c ON c.paciente_id = p.id
        WHERE p.nutricionista_id = ${nutricionistaId}
        GROUP BY p.id, p.nome, p.email, p.whatsapp, p.sexo, p.peso_inicial
      )
      SELECT 
        paciente_id,
        paciente_nome,
        paciente_email,
        paciente_whatsapp,
        paciente_sexo,
        paciente_peso_inicial,
        to_char(ultima_consulta_data, 'YYYY-MM-DD') as ultima_consulta_data,
        (CURRENT_DATE - ultima_consulta_data)::int as dias_sem_consulta
      FROM ultimas_consultas
      WHERE ultima_consulta_data < (CURRENT_DATE - INTERVAL '30 days')::date
        AND proximo_retorno_futuro IS NULL
      ORDER BY ultima_consulta_data ASC
    `;

    const pacientesSemRetorno: PacienteSemRetorno[] = (semRetornoResult || []).map((row: any) => ({
      paciente_id: row.paciente_id,
      paciente_nome: row.paciente_nome,
      paciente_email: row.paciente_email,
      paciente_whatsapp: row.paciente_whatsapp,
      paciente_sexo: row.paciente_sexo,
      paciente_peso_inicial: row.paciente_peso_inicial ? Number(row.paciente_peso_inicial) : null,
      ultima_consulta_data: row.ultima_consulta_data,
      dias_sem_consulta: Number(row.dias_sem_consulta),
    }));

    return {
      totalPacientes,
      consultasSemana,
      pacientesSemRetorno,
    };
  } catch (error) {
    console.error('Erro ao carregar dados do Dashboard:', error);
    return {
      totalPacientes: 0,
      consultasSemana: 0,
      pacientesSemRetorno: [],
    };
  }
}

/**
 * Busca a lista de pacientes do nutricionista
 */
export async function getPacientes(nutricionistaId: string): Promise<Paciente[]> {
  if (!sql || !nutricionistaId) return [];

  try {
    const result = await sql`
      SELECT 
        id, nutricionista_id, nome, 
        to_char(data_nascimento, 'YYYY-MM-DD') as data_nascimento,
        sexo, whatsapp, email, peso_inicial, altura,
        objetivos, objetivo_texto, nivel_atividade,
        patologias, restricoes_alimentares, alergias,
        medicamentos, suplementos, refeicoes_por_dia,
        horario_acorda, horario_dorme, litros_agua,
        atividade_fisica, atividade_fisica_descricao, observacoes,
        created_at
      FROM pacientes
      WHERE nutricionista_id = ${nutricionistaId}
      ORDER BY nome ASC
    `;
    return result as Paciente[];
  } catch (error) {
    console.error('Erro ao buscar pacientes:', error);
    return [];
  }
}

/**
 * Busca detalhes de um paciente específico e seu histórico de consultas
 */
export async function getPacienteDetails(pacienteId: string): Promise<{ paciente: Paciente | null; consultas: Consulta[] }> {
  if (!sql || !pacienteId) return { paciente: null, consultas: [] };

  try {
    const pacienteRows = await sql`
      SELECT 
        id, nutricionista_id, nome, 
        to_char(data_nascimento, 'YYYY-MM-DD') as data_nascimento,
        sexo, whatsapp, email, peso_inicial, altura,
        objetivos, objetivo_texto, nivel_atividade,
        patologias, restricoes_alimentares, alergias,
        medicamentos, suplementos, refeicoes_por_dia,
        horario_acorda, horario_dorme, litros_agua,
        atividade_fisica, atividade_fisica_descricao, observacoes,
        created_at
      FROM pacientes
      WHERE id = ${pacienteId}
      LIMIT 1
    `;

    const consultasRows = await sql`
      SELECT 
        id, paciente_id, 
        to_char(data_consulta, 'YYYY-MM-DD') as data_consulta,
        peso, cintura, quadril, percentual_gordura, observacoes,
        to_char(proximo_retorno, 'YYYY-MM-DD') as proximo_retorno,
        created_at
      FROM consultas
      WHERE paciente_id = ${pacienteId}
      ORDER BY data_consulta DESC
    `;

    return {
      paciente: pacienteRows.length > 0 ? (pacienteRows[0] as Paciente) : null,
      consultas: consultasRows as Consulta[],
    };
  } catch (error) {
    console.error('Erro ao buscar detalhes do paciente:', error);
    return { paciente: null, consultas: [] };
  }
}

/**
 * Cria um novo paciente no banco de dados Neon
 */
export async function createPaciente(data: Partial<Paciente>): Promise<Paciente | null> {
  if (!sql) return null;

  try {
    const rows = await sql`
      INSERT INTO pacientes (
        nutricionista_id, nome, data_nascimento, sexo, whatsapp, email,
        peso_inicial, altura, objetivo_texto, nivel_atividade,
        medicamentos, suplementos, observacoes
      ) VALUES (
        ${data.nutricionista_id},
        ${data.nome},
        ${data.data_nascimento || null},
        ${data.sexo || null},
        ${data.whatsapp || null},
        ${data.email || null},
        ${data.peso_inicial || null},
        ${data.altura || null},
        ${data.objetivo_texto || null},
        ${data.nivel_atividade || null},
        ${data.medicamentos || null},
        ${data.suplementos || null},
        ${data.observacoes || null}
      )
      RETURNING *
    `;
    return rows.length > 0 ? (rows[0] as Paciente) : null;
  } catch (error) {
    console.error('Erro ao cadastrar paciente:', error);
    throw error;
  }
}

/**
 * Registra uma nova consulta no banco de dados Neon
 */
export async function createConsulta(data: Partial<Consulta>): Promise<Consulta | null> {
  if (!sql) return null;

  try {
    const rows = await sql`
      INSERT INTO consultas (
        paciente_id, data_consulta, peso, cintura, quadril, percentual_gordura,
        observacoes, proximo_retorno
      ) VALUES (
        ${data.paciente_id},
        ${data.data_consulta},
        ${data.peso || null},
        ${data.cintura || null},
        ${data.quadril || null},
        ${data.percentual_gordura || null},
        ${data.observacoes || null},
        ${data.proximo_retorno || null}
      )
      RETURNING *
    `;
    return rows.length > 0 ? (rows[0] as Consulta) : null;
  } catch (error) {
    console.error('Erro ao registrar consulta:', error);
    throw error;
  }
}
