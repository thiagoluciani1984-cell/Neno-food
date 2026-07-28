# Agente de impressão local — Nenos Food

Programinha que fica rodando no computador do restaurante, observa pedidos
novos e manda o cupom pra impressora térmica usando o driver/spooler do
Windows — o mesmo caminho que o teste de impressão do Windows usa. Isso
resolve o caso de impressoras (como a POS-58) que não expõem uma porta
serial de verdade, então o navegador sozinho não consegue mandar dados
direto pra elas.

## Instalação rápida (recomendado — arquivo .exe, sem instalar nada)

1. Compartilha a impressora no Windows (passo 1 abaixo) e anota o nome do
   compartilhamento.
2. Baixa o arquivo `NenosPrintAgent.exe` (pasta `dist/` deste projeto, ou
   o link que foi te passado).
3. Dá **duplo clique** nele.
   - O Windows provavelmente vai mostrar um aviso azul **"O Windows
     protegeu seu PC"** (SmartScreen) — isso é normal para programas novos
     sem "assinatura" paga de editora, não é vírus. Clica em **"Mais
     informações"** e depois em **"Executar assim mesmo"**.
4. Na primeira vez, ele vai perguntar (dentro da própria janela preta):
   - E-mail e senha do painel do restaurante (o mesmo de
     `neno-food.vercel.app/login`)
   - Nome do compartilhamento da impressora (passo 1 abaixo)
   Ele salva essas respostas num arquivo `config.json` do lado do `.exe` e
   já testa a impressão na hora.
5. Depois disso, é só deixar essa janela aberta durante o funcionamento —
   os próximos pedidos já saem impressos sozinhos.
6. Errou algo na configuração? Dá duplo clique de novo segurando não é
   necessário — só abre um terminal na pasta do `.exe` e roda:
   ```
   NenosPrintAgent.exe --setup
   ```
   (ou apaga o arquivo `config.json` e abre o `.exe` de novo)
7. Pra deixar iniciando sozinho com o Windows: aperta `Win + R`, digita
   `shell:startup`, Enter, e copia um atalho do `.exe` pra essa pasta.

O restante deste README documenta a versão em Node.js (pra quem preferir
rodar via `npm` em vez do `.exe` pronto).

## 1. Compartilhar a impressora no Windows

1. Abre **Configurações → Bluetooth e dispositivos → Impressoras e scanners**
   (ou no Painel de Controle: **Dispositivos e Impressoras**).
2. Clica na impressora POS-58 → **Propriedades da impressora**.
3. Vai na aba **Compartilhamento**.
4. Marca **"Compartilhar esta impressora"**.
5. Em **Nome do compartilhamento**, coloca algo simples, tipo `POS58` (sem
   espaços). Anota esse nome — é o `PRINTER_SHARE_NAME` do passo 4.
6. Clica **OK**.

## 2. Instalar o Node.js (se ainda não tiver)

1. Acessa **https://nodejs.org** e baixa a versão **LTS** (recomendada).
2. Instala normalmente (Next, Next, Instalar).

## 3. Baixar esta pasta

Se você já tem o projeto Nenos Food nesse computador, é só usar a pasta
`scripts/print-agent` que já vem junto. Senão, baixa o repositório:

1. Acessa `https://github.com/thiagoluciani1984-cell/Neno-food`
2. Botão verde **Code → Download ZIP**
3. Extrai o ZIP e entra na pasta `scripts/print-agent`

## 4. Configurar

1. Dentro da pasta `scripts/print-agent`, abre um terminal (clique com botão
   direito → "Abrir no Terminal" ou "Abrir janela do PowerShell aqui").
2. Roda:
   ```
   npm install
   ```
3. Copia o arquivo `.env.example` e renomeia a cópia pra `.env`.
4. Abre o `.env` num editor de texto (Bloco de Notas serve) e preenche:
   - `RESTAURANT_EMAIL` e `RESTAURANT_PASSWORD`: o login do painel do
     restaurante (o mesmo de `neno-food.vercel.app/login`).
   - `PRINTER_SHARE_NAME`: o nome que você deu no passo 1.5 (ex: `POS58`).
   - Os campos `SUPABASE_URL`/`SUPABASE_ANON_KEY` já vêm preenchidos, não
     precisa mexer.

## 5. Testar

Ainda no terminal, dentro da pasta:
```
npm run test-print
```
Isso deve imprimir um cupom de teste na hora. Se não sair nada, confira se
o `PRINTER_SHARE_NAME` está exatamente igual ao nome do compartilhamento
(passo 1.5).

## 6. Rodar de verdade

Pra deixar rodando e imprimindo pedidos novos automaticamente:
```
npm start
```
Ou dá **duplo clique** no arquivo `start-agent.bat` (mais fácil pro dia a
dia — abre uma janela preta que precisa ficar aberta, pode minimizar).

Deixa essa janela aberta durante o funcionamento do restaurante. Cada
pedido novo que chegar já sai impresso sozinho em alguns segundos.

## 7. (Opcional) Iniciar sozinho quando ligar o computador

1. Aperta `Win + R`, digita `shell:startup` e aperta Enter (abre uma pasta).
2. Copia o arquivo `start-agent.bat` pra dentro dessa pasta (ou cria um
   atalho dele lá).
3. Pronto — toda vez que o computador ligar, o agente já inicia sozinho.

## Problemas comuns

| Sintoma | Solução |
|---|---|
| "Arquivo .env não encontrado" | Confirma que copiou `.env.example` pra `.env` (não só renomeou o exemplo mentalmente) |
| "Falha no login" | Confere e-mail/senha do `.env` — teste os mesmos dados em `neno-food.vercel.app/login` |
| Teste não imprime nada | Confirma o nome exato do compartilhamento (passo 1.5) e que a impressora está ligada/com papel |
| Pedido chega mas não imprime | Deixa a janela do agente aberta e visível — se fechar, ele para |
