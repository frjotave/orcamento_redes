document.addEventListener('DOMContentLoaded', () => {
    const elements = {
        descricaoOrcamentoInput: document.getElementById('descricao-orcamento'),
        criarOrcamentoBtn: document.getElementById('criar-orcamento'),
        descricaoItemInput: document.getElementById('descricao-item'),
        valorItemInput: document.getElementById('valor-item'),
        fornecedorItemInput: document.getElementById('fornecedor-item'),
        fotoItemInput: document.getElementById('foto-item'),
        adicionarItemBtn: document.getElementById('adicionar-item'),
        listaOrcamentos: document.getElementById('lista-orcamentos'),
        listaItens: document.getElementById('lista-itens'),
        totalItensSpan: document.getElementById('total-itens'),
        nomeOrcamentoSpan: document.getElementById('nome-orcamento'),
        excluirOrcamentoBtn: document.getElementById('excluir-orcamento'),
        gerarBackupBtn: document.getElementById('gerar-backup'),
        restaurarBackupInput: document.getElementById('restaurar-backup'),
        restaurarBackupBtn: document.getElementById('restaurar-backup-btn'),
        classifiedLists: document.getElementById('classified-lists'),
        gerarRelatorioBtn: document.getElementById('gerar-relatorio')
    };
    
    let orcamentoAtual = null;

    function imageToBase64(file, callback) {
        const reader = new FileReader();
        reader.onload = e => callback(e.target.result);
        reader.readAsDataURL(file);
    }

    function criarOrcamento() {
        const descricao = elements.descricaoOrcamentoInput.value.trim();
        if (!descricao) return alert('Por favor, insira a descrição do orçamento.');
        
        const orcamento = { descricao, itens: [] };
        localStorage.setItem(descricao, JSON.stringify(orcamento));
        elements.descricaoOrcamentoInput.value = '';
        carregarOrcamentos();
    }

    function carregarOrcamentos() {
        elements.listaOrcamentos.innerHTML = '';
        Object.keys(localStorage).forEach(nome => {
            const li = document.createElement('li');
            li.textContent = nome;
            const btn = document.createElement('button');
            btn.textContent = 'Carregar';
            btn.addEventListener('click', () => carregarOrcamento(nome));
            li.appendChild(btn);
            elements.listaOrcamentos.appendChild(li);
        });
    }

    function carregarOrcamento(nome) {
        orcamentoAtual = JSON.parse(localStorage.getItem(nome));
        elements.nomeOrcamentoSpan.textContent = orcamentoAtual.descricao;
        elements.nomeOrcamentoSpan.style.color = '#007bff';
        atualizarListaItens();
        verificarExclusaoOrcamento();
        elements.gerarRelatorioBtn.style.display = 'block';
    }

    function adicionarItem() {
        if (!orcamentoAtual) return alert('Por favor, carregue um orçamento primeiro.');

        const descricao = elements.descricaoItemInput.value.trim();
        const valor = parseFloat(elements.valorItemInput.value);
        const fornecedor = elements.fornecedorItemInput.value.trim();
        const foto = elements.fotoItemInput.files[0];

        if (!descricao || isNaN(valor) || valor <= 0) 
            return alert('Por favor, preencha todos os campos corretamente.');
        
        const item = { descricao, valor: valor.toFixed(2), fornecedor, foto: null };

        if (foto) {
            imageToBase64(foto, base64 => {
                item.foto = base64;
                salvarItem(item);
            });
        } else {
            salvarItem(item);
        }
    }

    function salvarItem(item) {
        orcamentoAtual.itens.push(item);
        localStorage.setItem(orcamentoAtual.descricao, JSON.stringify(orcamentoAtual));
        atualizarListaItens();
        limparCamposItem();
    }

    function limparCamposItem() {
        elements.descricaoItemInput.value = '';
        elements.valorItemInput.value = '';
        elements.fornecedorItemInput.value = '';
        elements.fotoItemInput.value = '';
    }

    function atualizarListaItens() {
        elements.listaItens.innerHTML = '';
        elements.classifiedLists.innerHTML = '';
        let total = 0;
        const classifiedItems = {};

        orcamentoAtual.itens.forEach((item, index) => {
            const li = document.createElement('li');
            li.innerHTML = `${item.descricao} - R$ ${item.valor} (Fornecedor: ${item.fornecedor})`;
            if (item.foto) {
                const img = document.createElement('img');
                img.src = item.foto;
                li.appendChild(img);
            }
            const btnExcluir = document.createElement('button');
            btnExcluir.textContent = 'Excluir';
            btnExcluir.addEventListener('click', () => excluirItem(index));
            li.appendChild(btnExcluir);
            elements.listaItens.appendChild(li);
            total += parseFloat(item.valor);

            // Classify items by supplier
            if (!classifiedItems[item.fornecedor]) {
                classifiedItems[item.fornecedor] = [];
            }
            classifiedItems[item.fornecedor].push(li);
        });

        elements.totalItensSpan.textContent = total.toFixed(2);

        // Display classified items
        for (const fornecedor in classifiedItems) {
            const section = document.createElement('section');
            const h3 = document.createElement('h3');
            h3.textContent = fornecedor;
            section.appendChild(h3);
            const ul = document.createElement('ul');
            classifiedItems[fornecedor].forEach(li => ul.appendChild(li));
            section.appendChild(ul);
            elements.classifiedLists.appendChild(section);
        }
    }

    function excluirItem(index) {
        orcamentoAtual.itens.splice(index, 1);
        localStorage.setItem(orcamentoAtual.descricao, JSON.stringify(orcamentoAtual));
        atualizarListaItens();
        verificarExclusaoOrcamento();
    }

    function verificarExclusaoOrcamento() {
        elements.excluirOrcamentoBtn.style.display = orcamentoAtual.itens.length === 0 ? 'block' : 'none';
        elements.excluirOrcamentoBtn.onclick = excluirOrcamento;
    }

    function excluirOrcamento() {
        localStorage.removeItem(orcamentoAtual.descricao);
        carregarOrcamentos();
        elements.nomeOrcamentoSpan.textContent = 'Nenhum';
        elements.listaItens.innerHTML = '';
        elements.totalItensSpan.textContent = '0.00';
        alert('Orçamento excluído com sucesso!');
        elements.gerarRelatorioBtn.style.display = 'none';
    }

    function gerarBackup() {
        const dados = Object.keys(localStorage).map(nome => JSON.parse(localStorage.getItem(nome)));
        const blob = new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'backup_orcamentos.json';
        a.click();
        URL.revokeObjectURL(url);
    }

    function restaurarBackup() {
        const file = elements.restaurarBackupInput.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = e => {
            JSON.parse(e.target.result).forEach(orcamento => {
                localStorage.setItem(orcamento.descricao, JSON.stringify(orcamento));
            });
            carregarOrcamentos();
            alert('Backup restaurado com sucesso!');
        };
        reader.readAsText(file);
    }

    function gerarRelatorio() {
        if (!orcamentoAtual) return alert('Por favor, carregue um orçamento primeiro.');

        let relatorio = `Orçamento: ${orcamentoAtual.descricao}\n\n`;
        relatorio += 'Itens:\n';
        orcamentoAtual.itens.forEach(item => {
            relatorio += `Descrição: ${item.descricao}\n`;
            relatorio += `Valor: R$ ${item.valor}\n`;
            relatorio += `Fornecedor: ${item.fornecedor}\n\n`;
        });
        relatorio += `Total: R$ ${elements.totalItensSpan.textContent}\n`;

        const blob = new Blob([relatorio], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${orcamentoAtual.descricao}_relatorio.txt`;
        a.click();
        URL.revokeObjectURL(url);
    }

    elements.criarOrcamentoBtn.addEventListener('click', criarOrcamento);
    elements.adicionarItemBtn.addEventListener('click', adicionarItem);
    elements.gerarBackupBtn.addEventListener('click', gerarBackup);
    elements.restaurarBackupBtn.addEventListener('click', restaurarBackup);
    elements.gerarRelatorioBtn.addEventListener('click', gerarRelatorio);
    carregarOrcamentos();
});
