const db = require('../config/database');

const camposAtualizaveis = [
    'matricula',
    'nome',
    'data_nascimento',
    'serie',
    'endereco_embarque',
    'numero',
    'bairro',
    'cidade',
    'estado',
    'cep',
    'rota_id',
    'usuario_id'
];

class AlunoModel {
    static async findAll() {
        const result = await db.query(`
            SELECT DISTINCT alunos.*, 
                   rotas.nome AS rota_nome,
                   est.email AS email_estudante
            FROM alunos 
            LEFT JOIN rotas ON alunos.rota_id = rotas.id
            LEFT JOIN usuarios est ON alunos.usuario_id = est.id
            WHERE alunos.ativo = TRUE 
            ORDER BY alunos.id ASC
        `);

        const alunos = result.rows;

        if (alunos.length > 0) {
            const alunoIds = alunos.map(a => a.id);
            const respResult = await db.query(`
                SELECT ra.aluno_id, u.id, u.nome, u.email, ra.parentesco, ra.principal
                FROM responsaveis_alunos ra
                JOIN usuarios u ON ra.usuario_id = u.id
                WHERE ra.aluno_id = ANY($1::int[])
            `, [alunoIds]);

            const responsaveisPorAluno = respResult.rows.reduce((acc, curr) => {
                if (!acc[curr.aluno_id]) acc[curr.aluno_id] = [];
                acc[curr.aluno_id].push({
                    id: curr.id,
                    nome: curr.nome,
                    email: curr.email,
                    parentesco: curr.parentesco,
                    principal: curr.principal
                });
                return acc;
            }, {});

            alunos.forEach(aluno => {
                aluno.responsaveis = responsaveisPorAluno[aluno.id] || [];
                if (aluno.responsaveis.length > 0) {
                    aluno.email_responsavel = aluno.responsaveis[0].email;
                }
            });
        }

        return alunos;
    }

    static async findById(id) {
        const result = await db.query(`
            SELECT alunos.*, 
                   rotas.nome AS rota_nome,
                   est.email AS email_estudante 
            FROM alunos 
            LEFT JOIN rotas ON alunos.rota_id = rotas.id
            LEFT JOIN usuarios est ON alunos.usuario_id = est.id 
            WHERE alunos.id = $1
        `, [id]);

        if (result.rows.length === 0) return null;

        const aluno = result.rows[0];

        const respResult = await db.query(`
            SELECT u.id, u.nome, u.email, ra.parentesco, ra.principal
            FROM responsaveis_alunos ra
            JOIN usuarios u ON ra.usuario_id = u.id
            WHERE ra.aluno_id = $1
        `, [id]);
        
        aluno.responsaveis = respResult.rows;
        if (aluno.responsaveis.length > 0) {
            aluno.email_responsavel = aluno.responsaveis[0].email;
        }

        return aluno;
    }

    static async findByResponsavel(responsavelId) {
        const result = await db.query(`
            SELECT alunos.* 
            FROM alunos
            JOIN responsaveis_alunos ra ON alunos.id = ra.aluno_id
            WHERE ra.usuario_id = $1 AND alunos.ativo = TRUE 
            ORDER BY alunos.id ASC
        `, [responsavelId]);
        
        return result.rows;
    }

    static async create(dados) {
        const {
            matricula,
            nome,
            data_nascimento,
            serie,
            endereco_embarque,
            numero,
            bairro,
            cidade,
            estado,
            cep,
            rota_id,
            usuario_id,
            parentesco = 'Responsável'
        } = dados;

        const emailParaBusca = dados.email_responsavel || dados.responsavel_email || dados.emailResponsavel;

        const client = await db.connect();
        try {
            await client.query('BEGIN');

            if (matricula && String(matricula).trim() !== '') {
                const alunoExistente = await client.query(
                    `SELECT id FROM alunos WHERE matricula = $1`,
                    [String(matricula).trim()]
                );
                if (alunoExistente.rows.length > 0) {
                    throw new Error(`Já existe um estudante cadastrado com a matrícula "${matricula}".`);
                }
            }

            const queryAluno = `
                INSERT INTO alunos (
                    matricula, nome, data_nascimento, serie, endereco_embarque, numero,
                    bairro, cidade, estado, cep, rota_id, usuario_id, ativo
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, TRUE)
                RETURNING *
            `;
            const valoresAluno = [
                matricula ? String(matricula).trim() : null,
                nome,
                data_nascimento,
                serie,
                endereco_embarque,
                numero,
                bairro,
                cidade,
                estado,
                cep,
                rota_id || null,
                usuario_id || null
            ];

            const resultAluno = await client.query(queryAluno, valoresAluno);
            const alunoCriado = resultAluno.rows[0];

            // Vinculação imediata com a tabela N:M de responsáveis
            if (emailParaBusca && String(emailParaBusca).trim() !== '') {
                const resUsuario = await client.query(
                    'SELECT id FROM usuarios WHERE email = $1',
                    [String(emailParaBusca).trim().toLowerCase()]
                );

                if (resUsuario.rows.length === 0) {
                    throw new Error(`Responsável com o e-mail "${emailParaBusca}" não foi encontrado na tabela de usuários.`);
                }

                const usuarioIdResponsavel = resUsuario.rows[0].id;

                await client.query(`
                    INSERT INTO responsaveis_alunos (usuario_id, aluno_id, parentesco, principal)
                    VALUES ($1, $2, $3, TRUE)
                    ON CONFLICT (usuario_id, aluno_id) DO UPDATE 
                    SET parentesco = EXCLUDED.parentesco
                `, [usuarioIdResponsavel, alunoCriado.id, parentesco]);
            }

            await client.query('COMMIT');
            return await this.findById(alunoCriado.id);

        } catch (error) {
            await client.query('ROLLBACK');
            if (error.code === '23505') {
                throw new Error('A matrícula informada já pertence a outro aluno cadastrado.');
            }
            throw error;
        } finally {
            client.release();
        }
    }

    static async update(id, dados) {
        const client = await db.connect();
        try {
            await client.query('BEGIN');

            if (dados.matricula !== undefined && dados.matricula !== null && String(dados.matricula).trim() !== '') {
                const alunoConflito = await client.query(
                    `SELECT id FROM alunos WHERE matricula = $1 AND id != $2`,
                    [String(dados.matricula).trim(), id]
                );
                if (alunoConflito.rows.length > 0) {
                    throw new Error(`A matrícula "${dados.matricula}" já está sendo utilizada por outro estudante.`);
                }
            }

            const campos = camposAtualizaveis.filter(campo =>
                Object.prototype.hasOwnProperty.call(dados, campo)
            );

            if (campos.length > 0) {
                const atribuicoes = campos.map((campo, indice) => `${campo} = $${indice + 1}`);
                // Correção segura do mapeamento de valores
                const valores = campos.map(campo => {
                    const valor = dados[campo];
                    if (campo === 'matricula' && valor) {
                        return String(valor).trim();
                    }
                    return valor;
                });
                valores.push(id);

                await client.query(
                    `UPDATE alunos SET ${atribuicoes.join(', ')} WHERE id = $${valores.length}`,
                    valores
                );
            }

            const emailParaBusca = dados.email_responsavel || dados.responsavel_email || dados.emailResponsavel;

            if (emailParaBusca !== undefined) {
                if (emailParaBusca && String(emailParaBusca).trim() !== '') {
                    const resUsuario = await client.query(
                        'SELECT id FROM usuarios WHERE email = $1',
                        [String(emailParaBusca).trim().toLowerCase()]
                    );

                    if (resUsuario.rows.length === 0) {
                        throw new Error(`Responsável com o e-mail "${emailParaBusca}" não foi encontrado.`);
                    }

                    const usuarioIdResponsavel = resUsuario.rows[0].id;

                    await client.query(`
                        INSERT INTO responsaveis_alunos (usuario_id, aluno_id, parentesco, principal)
                        VALUES ($1, $2, $3, TRUE)
                        ON CONFLICT (usuario_id, aluno_id) DO UPDATE 
                        SET parentesco = EXCLUDED.parentesco
                    `, [usuarioIdResponsavel, id, dados.parentesco || 'Responsável']);
                }
            }

            await client.query('COMMIT');
            return await this.findById(id);

        } catch (error) {
            await client.query('ROLLBACK');
            if (error.code === '23505') {
                throw new Error('A matrícula informada já pertence a outro aluno.');
            }
            throw error;
        } finally {
            client.release();
        }
    }

    static async deactivate(id) {
        const result = await db.query(
            'UPDATE alunos SET ativo = FALSE WHERE id = $1 RETURNING *',
            [id]
        );
        return result.rows[0];
    }
}

module.exports = AlunoModel;
