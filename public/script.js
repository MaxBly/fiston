var socket = io.connect('http://bly-net.com:7000/app');

var table = document.createElement('table');
var p = document.querySelector('p');


var d_words = document.getElementById('words');
d_words.style.visibility = "hidden";

var b_disp = document.getElementById('disp');
b_disp.addEventListener('click', _ => {
    d_words.style.visibility = (d_words.style.visibility == "hidden") ? "visible" : "hidden";
    b_disp.innerHTML = (d_words.style.visibility == "hidden") ? "Afficher les mots" : "Masquer les mots";
});

var b_send = document.getElementById('send');
b_send.addEventListener('click', _ => {
    var w = document.getElementById('w').value;
    var c = document.getElementById('c').value;
    socket.emit('save', { w, c });
});

socket.emit('getWords');

socket.on('loadWords', words => {
    console.log(words)
    init(words, table);
});

socket.on('saveOk', _ => {
    socket.emit('getWords');
})

var init = (words, table) => {
    p.innerHTML = "Bot 100% useless créé par MaxBly, vous pouvez ajouter un mot null à la base de donnée ici, il y en a déjà " + parseInt(words.length - 1);
    loadTable(words, table);
}

var loadTable = (words, table) => {
    table.innerHTML = "";
    table.className = "table";
    d_words.append(table);
    var st_tr = document.createElement('tr');
    table.append(st_tr);
    var st_th = document.createElement('th');
    var nd_th = document.createElement('th');
    var rd_th = document.createElement('th');
    st_th.innerHTML = "<u><b>N°</b></u>";
    nd_th.innerHTML = "<u><b>Mot</b></u>";
    rd_th.innerHTML = "<u><b>Credit</b></u>";
    st_tr.append(st_th);
    st_tr.append(nd_th);
    st_tr.append(rd_th);

    for (var i = 1; i <= words.length - 1; i++) {
        var tr = document.createElement('tr');
        var i_th = document.createElement('th');
        if (words[0] == i) {
            tr.className = "table-active"
            i_th.innerText = "➤ " + i;
        } else {
            i_th.innerText = "# " + i;
        }
        var w_th = document.createElement('th');
        var c_th = document.createElement('th');
        w_th.innerText = words[i][0];
        c_th.innerText = words[i][1];
        table.append(tr);
        tr.append(i_th);
        tr.append(w_th);
        tr.append(c_th);
    }
    console.log(table)
}
