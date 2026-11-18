CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    perfil VARCHAR(50) NOT NULL CHECK (perfil IN ('GESTOR', 'ADMIN', 'MOTORISTA', 'RESPONSAVEL', 'ALUNO')),
    telefone VARCHAR(30),
    verified BOOLEAN NOT NULL DEFAULT FALSE,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    refresh_token TEXT,
    reset_token VARCHAR(255),
    reset_token_expires TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT usuarios_email_unique UNIQUE (email)
);

CREATE TABLE IF NOT EXISTS veiculos (
    id SERIAL PRIMARY KEY,
    placa VARCHAR(20) NOT NULL,
    modelo VARCHAR(100) NOT NULL,
    capacidade INTEGER NOT NULL CHECK (capacidade > 0),
    ano INTEGER,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT veiculos_placa_unique UNIQUE (placa)
);

CREATE TABLE IF NOT EXISTS alunos (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    data_nascimento DATE,
    serie VARCHAR(100),
    endereco_embarque VARCHAR(255),
    numero VARCHAR(50),
    bairro VARCHAR(100),
    cidade VARCHAR(100),
    estado VARCHAR(2),
    cep VARCHAR(20),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    observacoes TEXT,
    email_responsavel VARCHAR(255),
    usuario_id INTEGER,            
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT alunos_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL,
    CONSTRAINT alunos_usuario_id_unique UNIQUE (usuario_id)
);

CREATE INDEX IF NOT EXISTS idx_alunos_email_responsavel 
    ON alunos (LOWER(email_responsavel)) 
    WHERE email_responsavel IS NOT NULL;

CREATE TABLE IF NOT EXISTS responsaveis_alunos (
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    aluno_id INTEGER NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
    parentesco VARCHAR(50) NOT NULL DEFAULT 'RESPONSAVEL',
    principal BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (usuario_id, aluno_id)
);

CREATE INDEX IF NOT EXISTS idx_responsaveis_alunos_aluno ON responsaveis_alunos (aluno_id);

CREATE TABLE IF NOT EXISTS rotas (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    turno VARCHAR(20) NOT NULL DEFAULT 'MANHA' CHECK (turno IN ('MANHA', 'TARDE', 'NOITE')),
    destino_lat DECIMAL(10, 8),
    destino_lng DECIMAL(11, 8),
    ativa BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS paradas_rota (
    id SERIAL PRIMARY KEY,
    rota_id INTEGER NOT NULL REFERENCES rotas(id) ON DELETE CASCADE,
    endereco VARCHAR(255) NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    horario_embarque TIME,
    horario_desembarque TIME,
    ordem INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_paradas_rota_ordem ON paradas_rota (rota_id, ordem);

CREATE TABLE IF NOT EXISTS rotas_alunos (
    rota_id INTEGER NOT NULL REFERENCES rotas(id) ON DELETE CASCADE,
    aluno_id INTEGER NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
    sentido VARCHAR(20) NOT NULL DEFAULT 'IDA_VOLTA' CHECK (sentido IN ('IDA', 'VOLTA', 'IDA_VOLTA')),
    ativa BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (rota_id, aluno_id, sentido)
);

CREATE TABLE IF NOT EXISTS viagens (
    id SERIAL PRIMARY KEY,
    rota_id INTEGER NOT NULL REFERENCES rotas(id) ON DELETE RESTRICT,
    veiculo_id INTEGER NOT NULL REFERENCES veiculos(id) ON DELETE RESTRICT,
    motorista_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
    data DATE NOT NULL DEFAULT CURRENT_DATE,
    turno VARCHAR(20) NOT NULL CHECK (turno IN ('MANHA', 'TARDE', 'NOITE')),
    status VARCHAR(30) NOT NULL DEFAULT 'AGENDADA' 
        CHECK (status IN ('AGENDADA', 'EM_ANDAMENTO', 'FINALIZADA', 'CANCELADA')),
    iniciada_em TIMESTAMP,
    finalizada_em TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_viagens_data_status ON viagens (data, status);
CREATE INDEX IF NOT EXISTS idx_viagens_motorista ON viagens (motorista_id);

CREATE TABLE IF NOT EXISTS viagens_alunos (
    viagem_id INTEGER NOT NULL REFERENCES viagens(id) ON DELETE CASCADE,
    aluno_id INTEGER NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
    status VARCHAR(30) NOT NULL DEFAULT 'PREVISTO' 
        CHECK (status IN ('PREVISTO', 'EMBARCADO', 'DESEMBARCADO', 'AUSENTE')),
    embarcado_em TIMESTAMP,
    desembarcado_em TIMESTAMP,
    observacao TEXT,
    PRIMARY KEY (viagem_id, aluno_id)
);

CREATE INDEX IF NOT EXISTS idx_viagens_alunos_aluno ON viagens_alunos (aluno_id);

CREATE TABLE IF NOT EXISTS posicoes_viagem (
    id SERIAL PRIMARY KEY,
    viagem_id INTEGER NOT NULL REFERENCES viagens(id) ON DELETE CASCADE,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    velocidade DECIMAL(5, 2),
    heading DECIMAL(5, 2),
    registrado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_posicoes_viagem_tempo ON posicoes_viagem (viagem_id, registrado_em DESC);

CREATE TABLE IF NOT EXISTS presencas_alunos (
    id SERIAL PRIMARY KEY,
    viagem_id INTEGER NOT NULL REFERENCES viagens(id) ON DELETE CASCADE,
    aluno_id INTEGER NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
    tipo VARCHAR(30) NOT NULL CHECK (tipo IN ('EMBARQUE', 'DESEMBARQUE')),
    registrado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    CONSTRAINT presencas_alunos_viagem_aluno_tipo_unique UNIQUE (viagem_id, aluno_id, tipo)
);

CREATE TABLE IF NOT EXISTS ausencias_alunos (
    id SERIAL PRIMARY KEY,
    aluno_id INTEGER NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
    registrado_por INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    data DATE NOT NULL DEFAULT CURRENT_DATE,
    turno VARCHAR(20) NOT NULL DEFAULT 'TODOS' CHECK (turno IN ('MANHA', 'TARDE', 'NOITE', 'TODOS')),
    motivo TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ausencias_alunos_aluno_data_turno_unique UNIQUE (aluno_id, data, turno)
);