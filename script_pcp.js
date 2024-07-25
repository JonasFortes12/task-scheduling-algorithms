window.onload = function () {
    var tarefas = JSON.parse(localStorage.getItem("tarefas_pcp"));
    if (tarefas) {
        var tbody = document.getElementById("tbody");
        tarefas.forEach(function (tarefa) {
            adicionarLinhaTabela(tbody, tarefa);
        });
    }
}

function adicionarTarefa() {
    var tarefa = document.getElementById("tarefa").value.trim();
    var periodo = document.getElementById("periodo").value.trim();
    var tempo = document.getElementById("tempo").value.trim();
    var prioridade = document.getElementById("prioridade").value.trim();
    var tempoBloqueio = document.getElementById("tempoBloqueio").value.trim();

    if (tarefa === '' || periodo === '' || tempo === '' || prioridade === '' || tempoBloqueio === '') {
        alert("Todos os campos devem ser preenchidos!");
        return;
    }

    var tbody = document.getElementById("tbody");
    var tarefaObj = { nome: tarefa, periodo: periodo, tempo: tempo, prioridade: prioridade, tempoBloqueio: tempoBloqueio };
    adicionarLinhaTabela(tbody, tarefaObj);

    // Limpar os campos de entrada após adicionar a tarefa
    document.getElementById("tarefa").value = "";
    document.getElementById("periodo").value = "";
    document.getElementById("tempo").value = "";
    document.getElementById("prioridade").value = "";
    document.getElementById("tempoBloqueio").value = "";

    // Salvar as tarefas no localStorage
    salvarTarefas();
}

function adicionarLinhaTabela(tbody, tarefa) {
    var newRow = tbody.insertRow();
    newRow.insertCell().innerText = tarefa.nome;
    newRow.insertCell().innerText = tarefa.periodo;
    newRow.insertCell().innerText = tarefa.tempo;
    newRow.insertCell().innerText = tarefa.prioridade;
    newRow.insertCell().innerText = tarefa.tempoBloqueio;

    var cellAcoes = newRow.insertCell();

    var editarBtn = document.createElement("button");
    editarBtn.className = "btn btn-primary btn-sm";
    editarBtn.innerHTML = '<i class="bi bi-pencil"></i>';
    editarBtn.onclick = function () {
        editarTarefa(newRow, tarefa);
    };
    cellAcoes.appendChild(editarBtn);

    var excluirBtn = document.createElement("button");
    excluirBtn.className = "btn btn-danger btn-sm";
    excluirBtn.innerHTML = '<i class="bi bi-trash"></i>';
    excluirBtn.onclick = function () {
        excluirTarefa(newRow);
    };
    cellAcoes.appendChild(excluirBtn);
}

function editarTarefa(row, tarefa) {
    var cells = row.cells;
    tarefa.nome = cells[0].innerText = prompt("Digite o novo nome da tarefa:", tarefa.nome) || tarefa.nome;
    tarefa.periodo = cells[1].innerText = prompt("Digite o novo período:", tarefa.periodo) || tarefa.periodo;
    tarefa.tempo = cells[2].innerText = prompt("Digite o novo tempo de computação:", tarefa.tempo) || tarefa.tempo;
    tarefa.prioridade = cells[3].innerText = prompt("Digite a nova prioridade:", tarefa.prioridade) || tarefa.prioridade;
    tarefa.tempoBloqueio = cells[4].innerText = prompt("Digite o novo tempo de bloqueio:", tarefa.tempoBloqueio) || tarefa.tempoBloqueio;
    salvarTarefas();
}

function excluirTarefa(row) {
    row.remove();
    salvarTarefas();
}

function salvarTarefas() {
    var tbody = document.getElementById("tbody");
    var rows = tbody.getElementsByTagName("tr");
    var tarefas = [];

    for (var i = 0; i < rows.length; i++) {
        var row = rows[i];
        var tarefa = {
            nome: row.cells[0].innerText,
            periodo: row.cells[1].innerText,
            tempo: row.cells[2].innerText,
            prioridade: row.cells[3].innerText,
            tempoBloqueio: row.cells[4].innerText
        };
        tarefas.push(tarefa);
    }

    localStorage.setItem("tarefas_pcp", JSON.stringify(tarefas));
}


// ----------------------------- PCP -----------------------------

class Task {
    constructor(name, period, computationTime, priority, blockingTime) {
        this.name = name;
        this.period = period;
        this.computationTime = computationTime;
        this.priority = priority;
        this.blockingTime = blockingTime;
        this.nextReleaseTime = 0;
        this.remainingComputationTime = computationTime;
        this.inheritedPriority = priority;
        this.resourceCeiling = priority;
    }
}

// Função para simular a execução das tarefas
function simulatePCP(tasks, totalTime) {
    let time = 0;
    let schedule = [];
    let resourceCeiling = {};

    // Inicializa o teto de prioridade para cada recurso
    tasks.forEach(task => {
        resourceCeiling[task.name] = task.priority;
    });


    while (time < totalTime) {
        // Atualiza as prioridades herdadas
        tasks.forEach(task => {
            task.inheritedPriority = task.priority;
        });
        
        // Processa bloqueios e atualiza tetos de prioridade
        tasks.forEach(task => {
            if (task.remainingComputationTime > 0 && task.nextReleaseTime <= time) {
                // Verifica se a tarefa pode acessar o recurso
                let canAccess = true;
                for (let resource in resourceCeiling) {
                    if (task.priority <= resourceCeiling[resource] && resource !== task.name) {
                        canAccess = false;
                        break;
                    }
                }
                if (canAccess) {
                    resourceCeiling[task.name] = Math.max(resourceCeiling[task.name], task.priority);
                } else {
                    task.inheritedPriority = Math.max(task.inheritedPriority, resourceCeiling[task.name]);
                }
            }
        });

        // Ordena tarefas pela prioridade herdada (menor valor tem maior prioridade)
        tasks.sort((a, b) => a.inheritedPriority - b.inheritedPriority);

        // Encontra a tarefa que será executada
        let currentTask = null;
        for (let task of tasks) {
            if (task.remainingComputationTime > 0 && task.nextReleaseTime <= time) {
                currentTask = task;
                break;
            }
        }

        // Executa a tarefa
        if (currentTask) {
            schedule.push({ time, task: currentTask.name });
            currentTask.remainingComputationTime--;

            if (currentTask.remainingComputationTime === 0) {
                currentTask.nextReleaseTime += currentTask.period;
                currentTask.remainingComputationTime = currentTask.computationTime;
                // Remove tarefa da lista de bloqueios se necessário
                const index = blockedTasks.indexOf(currentTask.name);
                if (index > -1) {
                    blockedTasks.splice(index, 1);
                }
            } else {
                // Adiciona a tarefa à lista de bloqueios
                blockedTasks.push(currentTask.name);
            }
        } else {
            // Se não houver tarefa para executar, adicionar "sem tarefa" ao escalonamento
            schedule.push({ time, task: "Sem Tarefa" });
        }

        time++;
    }

    return schedule;
}


function calcularOrdemExec() {
    var tbody = document.getElementById("tbody");
    var rows = tbody.getElementsByTagName("tr");

    if (rows.length === 0) {
        alert("A tabela está vazia. Adicione tarefas antes de calcular a ordem de execução.");
        return;
    }

    var tarefas = [];

    for (var i = 0; i < rows.length; i++) {
        var row = rows[i];
        
        const tarefa = new Task(
            row.cells[0].innerText, 
            parseFloat(row.cells[1].innerText), 
            parseFloat(row.cells[2].innerText), 
            parseInt(row.cells[3].innerText), 
            parseFloat(row.cells[4].innerText));

        tarefas.push(tarefa);
    }



    const totalTime = 20;
    const ordem_exec = simulatePCP(tarefas, totalTime);


    // Criar tabela de ordem de execução
    var ordemExecucaoContainer = document.getElementById("ordemExecucaoContainer");
    ordemExecucaoContainer.innerHTML = ""; // Limpar conteúdo anterior
    var table = document.createElement("table");
    table.className = "table table-striped";
    
    var thead = document.createElement("thead");
    var headerRow = document.createElement("tr");
    var thTime = document.createElement("th");
    thTime.innerText = "Tempo";
    var thTask = document.createElement("th");
    thTask.innerText = "Tarefa";
    headerRow.appendChild(thTime);
    headerRow.appendChild(thTask);
    thead.appendChild(headerRow);
    table.appendChild(thead);

    var tbodyExec = document.createElement("tbody");
    ordem_exec.forEach(entry => {
        var row = document.createElement("tr");
        var cellTime = document.createElement("td");
        cellTime.innerText = entry.time;
        var cellTask = document.createElement("td");
        cellTask.innerText = entry.task;
        row.appendChild(cellTime);
        row.appendChild(cellTask);
        tbodyExec.appendChild(row);
    });
    table.appendChild(tbodyExec);

    ordemExecucaoContainer.appendChild(table);

}
