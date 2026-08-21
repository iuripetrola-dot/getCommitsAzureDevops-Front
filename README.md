# getCommitsAzureDevops

Frontend Angular para exibir os commits consultados pelo backend Node.js e disparar a exportacao do CSV.

## O que esta pronto

- Consulta indireta ao Azure DevOps via backend Node.js
- Consumo do backend Node.js via `environment.apiBaseUrl`
- Filtros por busca livre, usuario, repositorio e branch
- Cards de resumo com total de commits, repositorios e usuarios
- Painel de progresso e logs em tela
- Exportacao do resultado atual em CSV

## Como executar

Em uma maquina com Node.js e npm:

```bash
cd /home/iuri/Caixa/Projetos/getCommitsAzureDevops/Back-nodejs
npm install
npm run dev

cd /home/iuri/Caixa/Projetos/getCommitsAzureDevops/Front
npm install
npm start
```

Depois abra `http://localhost:4200`.

## Observacoes importantes

- A URL da API fica em `src/environments/environment*.ts`.
- O PAT em Base64 fica apenas no `config.json` consumido pelo backend Node.js.
