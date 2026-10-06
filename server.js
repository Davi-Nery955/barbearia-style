const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");
const crypto = require("crypto");

const app = express();

const PORT = 3000;

// ================================
// CONFIGURAÇÕES
// ================================

const ADMIN_USUARIO = "admin";
const ADMIN_SENHA = "123456";

// Sessões dos administradores
const sessoes = new Set();


// ================================
// MIDDLEWARES
// ================================

app.use(express.json());

app.use(cors());

app.use(express.static("public"));


// ================================
// BANCO DE DADOS
// ================================

const db = new sqlite3.Database("./database.db", (err) => {

    if (err) {
        console.log("Erro ao conectar ao banco:", err.message);
    } else {
        console.log("Banco de dados conectado!");
    }

});


db.run(`
    CREATE TABLE IF NOT EXISTS agendamentos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        telefone TEXT NOT NULL,
        servico TEXT NOT NULL,
        barbeiro TEXT NOT NULL,
        data TEXT NOT NULL,
        horario TEXT NOT NULL
    )
`, (err) => {

    if (err) {
        console.log("Erro ao criar tabela:", err.message);
    } else {
        console.log("Tabela de agendamentos pronta!");
    }

});


// ================================
// FUNÇÃO PARA VERIFICAR LOGIN
// ================================

function verificarLogin(req, res, next) {

    const token = req.headers.authorization;

    if (!token) {

        return res.status(401).json({
            mensagem: "Você precisa fazer login."
        });

    }

    if (!sessoes.has(token)) {

        return res.status(401).json({
            mensagem: "Sessão inválida ou expirada."
        });

    }

    next();
}


// ================================
// LOGIN
// ================================

app.post("/login", (req, res) => {

    const { usuario, senha } = req.body;


    if (
        usuario !== ADMIN_USUARIO ||
        senha !== ADMIN_SENHA
    ) {

        return res.status(401).json({
            mensagem: "Usuário ou senha incorretos."
        });

    }


    // Criar token
    const token = crypto.randomBytes(32).toString("hex");

    sessoes.add(token);


    res.json({
        mensagem: "Login realizado com sucesso!",
        token: token
    });

});


// ================================
// LOGOUT
// ================================

app.post("/logout", verificarLogin, (req, res) => {

    const token = req.headers.authorization;

    sessoes.delete(token);

    res.json({
        mensagem: "Logout realizado com sucesso."
    });

});


// ================================
// VERIFICAR SESSÃO
// ================================

app.get("/verificar-login", verificarLogin, (req, res) => {

    res.json({
        logado: true
    });

});


// ================================
// CRIAR AGENDAMENTO
// ================================

app.post("/agendamentos", (req, res) => {

    const {
        nome,
        telefone,
        servico,
        barbeiro,
        data,
        horario
    } = req.body;


    if (
        !nome ||
        !telefone ||
        !servico ||
        !barbeiro ||
        !data ||
        !horario
    ) {

        return res.status(400).json({
            mensagem: "Preencha todos os campos."
        });

    }


    const verificarHorario = `
        SELECT *
        FROM agendamentos
        WHERE barbeiro = ?
        AND data = ?
        AND horario = ?
    `;


    db.get(
        verificarHorario,
        [barbeiro, data, horario],
        (err, resultado) => {

            if (err) {

                return res.status(500).json({
                    mensagem: "Erro ao consultar o banco."
                });

            }


            if (resultado) {

                return res.status(400).json({
                    mensagem:
                        "Esse horário já está ocupado para esse barbeiro."
                });

            }


            const sql = `
                INSERT INTO agendamentos
                (
                    nome,
                    telefone,
                    servico,
                    barbeiro,
                    data,
                    horario
                )
                VALUES (?, ?, ?, ?, ?, ?)
            `;


            db.run(
                sql,
                [
                    nome,
                    telefone,
                    servico,
                    barbeiro,
                    data,
                    horario
                ],
                function (err) {

                    if (err) {

                        return res.status(500).json({
                            mensagem:
                                "Erro ao salvar o agendamento."
                        });

                    }


                    console.log(
                        "Novo agendamento criado. ID:",
                        this.lastID
                    );


                    res.json({
                        mensagem:
                            "Agendamento realizado com sucesso!",
                        id: this.lastID
                    });

                }
            );

        }
    );

});


// ================================
// LISTAR AGENDAMENTOS
// PROTEGIDO POR LOGIN
// ================================

app.get(
    "/agendamentos",
    verificarLogin,
    (req, res) => {

        db.all(
            `
            SELECT *
            FROM agendamentos
            ORDER BY data, horario
            `,
            [],
            (err, resultados) => {

                if (err) {

                    return res.status(500).json({
                        mensagem:
                            "Erro ao buscar agendamentos."
                    });

                }

                res.json(resultados);

            }
        );

    }
);


// ================================
// EXCLUIR AGENDAMENTO
// PROTEGIDO POR LOGIN
// ================================

app.delete(
    "/agendamentos/:id",
    verificarLogin,
    (req, res) => {

        const id = req.params.id;


        db.run(
            `DELETE FROM agendamentos WHERE id = ?`,
            [id],
            function (err) {

                if (err) {

                    return res.status(500).json({
                        mensagem:
                            "Erro ao excluir agendamento."
                    });

                }


                res.json({
                    mensagem:
                        "Agendamento excluído com sucesso!"
                });

            }
        );

    }
);


// ================================
// SERVIDOR
// ================================

app.listen(PORT, () => {

    console.log("");
    console.log("=================================");
    console.log("BARBEARIA ONLINE");
    console.log("Servidor: http://localhost:3000");
    console.log("=================================");
    console.log("");

});