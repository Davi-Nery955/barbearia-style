const formulario = document.getElementById("formAgendamento");

const mensagem = document.getElementById("mensagem");

formulario.addEventListener("submit", async function (event) {

    event.preventDefault();

    const nome = document.getElementById("nome").value;
    const telefone = document.getElementById("telefone").value;
    const servico = document.getElementById("servico").value;
    const barbeiro = document.getElementById("barbeiro").value;
    const data = document.getElementById("data").value;
    const horario = document.getElementById("horario").value;


    mensagem.textContent = "Enviando agendamento...";
    mensagem.style.color = "#c99a3d";


    try {

        const resposta = await fetch("/agendamentos", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({

                nome: nome,
                telefone: telefone,
                servico: servico,
                barbeiro: barbeiro,
                data: data,
                horario: horario

            })

        });


        const resultado = await resposta.json();


        if (!resposta.ok) {

            mensagem.textContent = resultado.mensagem;
            mensagem.style.color = "#ff5555";

            return;

        }


        mensagem.textContent =
            "✓ Agendamento realizado com sucesso!";

        mensagem.style.color = "#4caf50";


        formulario.reset();


    } catch (erro) {

        console.error(erro);

        mensagem.textContent =
            "Não foi possível conectar ao servidor.";

        mensagem.style.color = "#ff5555";

    }

});