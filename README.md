# simulado-avaliacoes-front

Front-end do Sistema de Avaliações: lista, cadastra (ADMIN) e exclui (ADMIN) avaliações, com login pelo Auth0.
React + Vite + `@auth0/auth0-react` (JavaScript).

## Como rodar

```bash
npm install
npm run dev     # http://localhost:5173
npm run build   # gera dist/
```

No `npm run dev`, as chamadas a `/api/*` são redirecionadas para o back local em `http://localhost:8080` (proxy em `vite.config.js`). Suba o back antes (`docker compose up` na pasta do back).

## Valores a trocar

| Arquivo | Valor | O que colocar |
|---|---|---|
| `src/main.jsx` | `TROCAR-AUTH0-DOMAIN` | Domínio do tenant Auth0 (ex.: `meu-tenant.us.auth0.com`) |
| `src/main.jsx` | `TROCAR-AUTH0-CLIENT-ID` | Client ID da aplicação SPA no Auth0 |
| `src/main.jsx` | `TROCAR-AUTH0-AUDIENCE` | Identificador (audience) da API no Auth0 |
| `vercel.json` | `TROCAR-IP-AWS` | IP público da máquina AWS onde roda o back |

## Checklist da Vercel

1. Importar o repositório `simulado-avaliacoes-front` na Vercel.
2. Framework preset: **Vite** (build `npm run build`, saída `dist`).
3. Depois do deploy, copiar a URL da Vercel (ex.: `https://meu-app.vercel.app`) e adicionar no Auth0 (Applications > sua aplicação > Settings):
   - **Allowed Callback URLs**
   - **Allowed Logout URLs**
   - **Allowed Web Origins**
4. Conferir que o IP em `vercel.json` está correto: em produção o rewrite `/api/avaliacoes/*` envia as chamadas para `http://IP:8080/avaliacoes/*`.
