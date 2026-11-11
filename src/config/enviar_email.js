const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Criamos e exportamos uma função assíncrona que encapsula o envio
const enviarEmailRecuperacao = async (destinatario, linkRedefinicao, nomeUsuario) => {
    const mailOptions = {
        from: '"Suporte RotaSegura" <noreplyrotasegura@gmail.com>',
        to: destinatario,
        subject: 'Redefinição de Senha - RotaSegura',
        html: `
            <div style="font-family: Arial, sans-serif; color: #333;">
                <h2>Olá, ${nomeUsuario || 'Usuário'}!</h2>
                <p>Você solicitou a redefinição de senha da sua conta no <strong>RotaSegura</strong>.</p>
                <p>Clique no botão abaixo para criar uma nova senha:</p>
                <a href="${linkRedefinicao}" style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Redefinir Senha</a>
                <p style="margin-top: 20px; font-size: 12px; color: #666;">Se você não solicitou isso, ignore este e-mail. O link expira em 1 hora.</p>
            </div>
        `
    };

    try {
        console.log(`[EMAIL] A tentar enviar e-mail de recuperação para: ${destinatario}...`);
        
        // Dispara o envio e guarda o resultado
        const info = await transporter.sendMail(mailOptions);
        
        console.log(`[EMAIL] Sucesso! E-mail enviado com ID: ${info.messageId}`);
        return true;
    } catch (error) {
        console.error(`[EMAIL] ERRO: Falha ao enviar e-mail para ${destinatario}.`);
        console.error(`[EMAIL] Detalhes do erro:`, error.message);
        
        // Relança o erro para que a rota saiba que o envio falhou, se necessário
        throw new Error("Não foi possível enviar o e-mail de recuperação. Tente novamente mais tarde.");
    }
};

module.exports = enviarEmailRecuperacao;