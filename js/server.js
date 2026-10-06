const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");

const app = express();

const PORT = process.env.PORT || 3000;

// Permitir JSON
app.use(express.json());

// Permitir requisições
app.use(cors());

// Servir os arquivos da pasta public
app.use(express.static("public"));

// Conectar ao banco
const db = new sqlite3.Database("./database.db", (err) => {

    if (err) {
        console.log("Erro ao conectar ao banco:", err.message);
    } else {
        console.log("Banco de dados conectado!");
    }

});


// ==========================================
// CRIAR TABELA
// ==========================================

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


// ==========================================
// TESTE DO SERVIDOR
// ==========================================

app.get("/teste", (req, res) => {

    res.send("Servidor funcionando!");

});


// ==========================================
// CRIAR AGENDAMENTO
// ==========================================

app.post("/agendamentos", (req, res) => {

    const {
        nome,
        telefone,
        servico,
        barbeiro,
        data,
        horario
    } = req.body;


    // Verificar campos
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


    // Verificar se horário já está ocupado
    const verificarHorario = `
        SELECT * FROM agendamentos
        WHERE barbeiro = ?
        AND data = ?
        AND horario = ?
    `;


    db.get(
        verificarHorario,
        [barbeiro, data, horario],
        (err, resultado) => {

            if (err) {

                console.log(err);

                return res.status(500).json({
                    mensagem: "Erro ao consultar o banco."
                });

            }


            // Horário ocupado
            if (resultado) {

                return res.status(400).json({
                    mensagem: "Esse horário já está ocupado para esse barbeiro."
                });

            }


            // Salvar agendamento
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

                        console.log(err);

                        return res.status(500).json({
                            mensagem: "Erro ao salvar o agendamento."
                        });

                    }


                    console.log(
                        "Novo agendamento criado. ID:",
                        this.lastID
                    );


                    res.json({
                        mensagem: "Agendamento realizado com sucesso!",
                        id: this.lastID
                    });

                }
            );

        }
    );

});


// ==========================================
// LISTAR AGENDAMENTOS
// ==========================================

app.get("/agendamentos", (req, res) => {

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
                    mensagem: "Erro ao buscar agendamentos."
                });

            }

            res.json(resultados);

        }
    );

});


// ==========================================
// EXCLUIR AGENDAMENTO
// ==========================================

app.delete("/agendamentos/:id", (req, res) => {

    const id = req.params.id;


    db.run(
        `DELETE FROM agendamentos WHERE id = ?`,
        [id],
        function (err) {

            if (err) {

                return res.status(500).json({
                    mensagem: "Erro ao excluir agendamento."
                });

            }


            res.json({
                mensagem: "Agendamento excluído com sucesso!"
            });

        }
    );

});


// ==========================================
// INICIAR SERVIDOR
// ==========================================

app.listen(PORT, () => {

    console.log("");
    console.log("=================================");
    console.log("BARBEARIA ONLINE");
    console.log("Servidor: http://localhost:3000");
    console.log("=================================");
    console.log("");

});