//const socket = io.connect('http://fiston.bly-net.com/');
let socket = io.connect('http://localhost:7000');

const table = document.createElement('table');
const p = document.querySelector('p');


const d_words = document.getElementById('words');
d_words.style.display = "none";

const b_disp = document.getElementById('disp');
b_disp.addEventListener('click', _ => {
    d_words.style.display = (d_words.style.display == "none") ? "inline" : "none";
    b_disp.innerHTML = (d_words.style.display == "none") ? "Afficher les mots" : "Masquer les mots";
});

const b_send = document.getElementById('send');
b_send.addEventListener('click', _ => {
    let w = document.getElementById('w');
    let word = w.value;
    let c = document.getElementById('c');
    let credit = c.value;
    socket.emit('save', { word, credit });
    w.value = "";
});

socket.emit('getReducedWords');

socket.on('loadReducedWords', words => {
    init(words, table);
});

socket.on('saveOk', _ => {
    socket.emit('getReducedWords');
})

const init = (words, table) => {
    p.innerHTML = "Bot 100% useless créé par MaxBly, vous pouvez ajouter un mot nul à la base de donnée ici, il y en a déjà " + words.length;
    loadTable(words, table);
}

const loadTable = (words, table) => {
    table.innerHTML = "";
    table.className = "table table-hover";
    d_words.append(table);
    let st_tr = document.createElement('tr');
    st_tr.className = "table-primary"
    table.append(st_tr);
    let st_th = document.createElement('th');
    let nd_th = document.createElement('th');
    let rd_th = document.createElement('th');
    st_th.innerHTML = "<u><b>N°</b></u>";
    nd_th.innerHTML = "<u><b>Mot</b></u>";
    rd_th.innerHTML = "<u><b>Credit</b></u>";
    st_tr.append(st_th);
    st_tr.append(nd_th);
    st_tr.append(rd_th);

    for (let i = words.length - 1; i >= 0; i--) {
        let tr = document.createElement('tr');
        let i_th = document.createElement('th');
        if (words[i].isNext) {
            tr.className = "table-success"
            i_th.innerText = "➤ " + (i + 1);
        } else {
            i_th.innerText = "# " + (i + 1);
            tr.className = "table-dark"
        }
        let w_th = document.createElement('th');
        let c_th = document.createElement('th');
        w_th.innerText = words[i].word;
        c_th.innerText = words[i].credit;
        table.append(tr);
        tr.append(i_th);
        tr.append(w_th);
        tr.append(c_th);
    }
}
