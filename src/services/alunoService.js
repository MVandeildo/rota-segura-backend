let alunos = [];
let proximoId = 1;


const criarAluno = (dados) => {
    const {
        nome,
        data_nascimento,
        serie,
        endereco_embarque,
        numero,
        bairro,
        cidade,
        estado,
        cep,
        responsavel_id,
        rota_id
    } = dados;

    if (
        !nome ||
        !data_nascimento ||
        !serie ||
        !endereco_embarque ||
        !numero ||
        !bairro ||
        !cidade ||
        !estado ||
        !responsavel_id ||
        !rota_id
    ) {
        throw new Error(
            'Nome, data de nascimento, série, endereço, número, bairro, cidade, estado, responsável e rota são obrigatórios.'
        );
    }

    const novoAluno = {
        id: proximoId++,
        nome,
        data_nascimento,
        serie,
        endereco_embarque,
        numero,
        bairro,
        cidade,
        estado,
        cep: cep || null,
        responsavel_id: Number(responsavel_id),
        rota_id: Number(rota_id),
        ativo: true
    };

    alunos.push(novoAluno);

    return novoAluno;
};


const listarAlunos = () => {
    return alunos;
};


const buscarAlunoPorId = (id) => {
    const aluno = alunos.find(
        aluno => aluno.id === Number(id)
    );

    if (!aluno) {
        throw new Error('Aluno não encontrado.');
    }

    return aluno;
};


const atualizarAluno = (id, dados) => {
    const aluno = alunos.find(
        aluno => aluno.id === Number(id)
    );

    if (!aluno) {
        throw new Error('Aluno não encontrado.');
    }

    const {
        nome,
        data_nascimento,
        serie,
        endereco_embarque,
        numero,
        bairro,
        cidade,
        estado,
        cep,
        responsavel_id,
        rota_id
    } = dados;

    if (nome) {
        aluno.nome = nome;
    }

    if (data_nascimento) {
        aluno.data_nascimento = data_nascimento;
    }

    if (serie) {
        aluno.serie = serie;
    }

    if (endereco_embarque) {
        aluno.endereco_embarque = endereco_embarque;
    }

    if (numero) {
        aluno.numero = numero;
    }

    if (bairro) {
        aluno.bairro = bairro;
    }

    if (cidade) {
        aluno.cidade = cidade;
    }

    if (estado) {
        aluno.estado = estado;
    }

    if (cep) {
        aluno.cep = cep;
    }

    if (responsavel_id) {
        aluno.responsavel_id = Number(responsavel_id);
    }

    if (rota_id) {
        aluno.rota_id = Number(rota_id);
    }

    return aluno;
};


const removerAluno = (id) => {
    const indice = alunos.findIndex(
        aluno => aluno.id === Number(id)
    );

    if (indice === -1) {
        throw new Error('Aluno não encontrado.');
    }

    alunos[indice].ativo = false;

    return alunos[indice];
};


module.exports = {
    criarAluno,
    listarAlunos,
    buscarAlunoPorId,
    atualizarAluno,
    removerAluno
};