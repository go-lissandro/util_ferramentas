# DEV_PROCESS.md

## Visão Geral

Este repositório possui um **processo de desenvolvimento padronizado** que foi recentemente atualizado para:
- Centralizar migrações de banco de dados em `gateway/src/config/database.ts`;
- Unificar configuração de paginação em `gateway/src/config/pagination.ts`;
- Consolidar lógica de hash de senhas em `gateway/src/utils/password.ts`;
- Aplicar rate limiting a endpoints críticos (ex.: video downloader);
- Validar entradas de forma robusta (ex.: `expiresAt`, `userId`, paginação).

A documentação abaixo descreve cada etapa, boas‑práticas e como garantir qualidade.

---

## 1. Migrações de Banco de Dados

### Onde
- Todas as tabelas são criadas em **`gateway/src/config/database.ts`**, dentro da função `runMigrations`.
- Não há mais migrações individuais em `app2/urlshortener.routes.ts`, `app6/biolink.routes.ts` ou `app7/habits.routes.ts`.

### Como funciona
```ts
await client.query(`
  CREATE TABLE IF NOT EXISTS short_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ...
  )
`);
```
- Cada `CREATE TABLE IF NOT EXISTS` garante idempotência.
- **Índices críticos** são declarados logo após as tabelas (ex.: `idx_short_links_slug`).
- Novas colunas (ex.: `deleted_at` em `entity_records`) são adicionadas como parte da mesma migração.

### Boas‑práticas
1. **Never drop tables** – use `IF NOT EXISTS` ou scripts de alteração que preservem dados.
2. **Atualizar índices** quando novas consultas são adicionadas.
3. **Executar migrações localmente** antes de push (`npm run dev` faz a chamada automática).

---

## 2. Configuração de Paginação

### Arquivo
- `gateway/src/config/pagination.ts`

```ts
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
  URL_SHORTENER_MAX_LIMIT: 50,
} as const;
```

### Uso
- Importado nos arquivos que precisam de paginação:
  ```ts
  import { PAGINATION } from '../../config/pagination';
  const pageNum = Math.max(PAGINATION.DEFAULT_PAGE, parseInt(page));
  const limitNum = Math.min(PAGINATION.MAX_LIMIT, Math.max(1, parseInt(limit)));
  ```
- Valores podem ser sobrescritos por necessidades específicas (ex.: `URL_SHORTENER_MAX_LIMIT`).

### Boas‑práticas
- **Não usar `||`** para tratar `0` como “ausente”.
- Sempre validar `parseInt` resultando em número positivo.
- Atualizar o arquivo quando novos limites são necessários.

---

## 3. Hash de Senha Centralizado

### Arquivo
- `gateway/src/utils/password.ts`

```ts
import bcrypt from 'bcryptjs';
const BCRYPT_ROUNDS = 12;
export async function hashPassword(pwd: string) { return bcrypt.hash(pwd, BCRYPT_ROUNDS); }
export async function verifyPassword(pwd: string, hash: string) { return bcrypt.compare(pwd, hash); }
```

### Onde usar
- Em `checkout.routes.ts` ao criar um usuário admin.
- Em `auth.routes.ts` ao validar login.

### Boas‑práticas
1. **Nunca expor `bcrypt` diretamente** – sempre passe por `hashPassword` / `verifyPassword`.
2. **Mantém o número de rounds em um só lugar** (facilita upgrade de segurança).
3. **Teste**: inclua teste unitário para garantir que `hashPassword` e `verifyPassword` funcionam corretamente.

---

## 4. Rate Limiting

### Arquivo de middleware
- `gateway/src/middleware/rateLimiter.ts`
- Exporta `rateLimiter` (público), `authRateLimiter` (login) e `tenantRateLimiter` (autenticado).

### Aplicação
- Endpoints públicos intensivos (ex.: `app4/video.routes.ts`) agora incluem:
  ```ts
  import { rateLimiter } from '../middleware/rateLimiter';
  videoRouter.use(rateLimiter);
  ```
- `authRateLimiter` já está configurado nas rotas de login.

### Boas‑práticas
- **Colocar o limiter antes de qualquer lógica pesada** para evitar execução desnecessária.
- Ajustar `windowMs` e `max` via variáveis de ambiente (`process.env.RATE_LIMIT_…`).
- Monitorar logs de `RATE_LIMIT_EXCEEDED` para identificar possíveis ataques ou uso legítimo excessivo.

---

## 5. Validação de Entrada

### Principais pontos adicionados
- **`expiresAt`**: agora verificado se é data válida e futura.
- **`userId`**: obrigatório; rejeita requisições sem claim `sub`.
- **Paginação**: validação explícita de valores positivos.
- **Slug custom**: regex já existente, mas inclusão de comentários sobre palavras reservadas.

### Como funciona (exemplo em `urlshortener.routes.ts`)
```ts
if (expiresAt) {
  const exp = new Date(expiresAt);
  if (isNaN(exp.getTime())) return res.status(400).json({error: 'Invalid expiresAt'});
  if (exp <= new Date()) return res.status(400).json({error: 'expiresAt must be future'});
}
```
- Use **Zod** para validações de payloads (já usado em `CreateLinkSchema`).

### Boas‑práticas
- Sempre validar **antes** de inserir no DB.
- Utilize schemas Zod para validar objetos inteiros e centralizar mensagens de erro.
- Documente cada campo nas APIs (Swagger/OpenAPI ou README).

---

## 6. Testes Automatizados

### Onde estão
- `gateway` usa **Jest** (já configurado no `package.json`).
- Testes existentes cobrem rotas principais.

### O que adicionar
1. **Testes de validação** para `expiresAt` e `userId`.
2. **Testes de paginação** que enviam `page=0` ou `limit=0` e esperam erro 400.
3. **Testes de rate limiting** (simular > `max` requests e esperar 429).
4. **Testes de hash de senha** (uso de `hashPassword`/`verifyPassword`).

### Como rodar
```bash
npm run test   # ou npm run test:watch
```

---

## 7. Checklist de PR (para futuros PRs)
1. **Migrations** – Verifique se não há `CREATE TABLE` fora de `database.ts`.
2. **Paginação** – Use `PAGINATION` e valide os parâmetros.
3. **Password** – Use funções de `utils/password.ts`.
4. **Rate Limiting** – Adicione `rateLimiter` nos novos endpoints públicos.
5. **Validação** – Crie Zod schemas ou validações manuais para novos campos.
6. **Testes** – Inclua cobertura de unidade e integração para tudo que foi alterado.
7. **Docs** – Atualize `README.md` ou `DEV_PROCESS.md` quando mudar o fluxo.

---

## 8. Onde encontrar detalhes adicionais
- **README.md** – Visão geral da arquitetura e scripts de start.
- **.github/PULL_REQUEST_TEMPLATE.md** – Formato obrigatório para PRs.
- **./gateway/src/config/** – Arquivos de configuração (database, middleware, pagination).
- **./gateway/src/utils/** – Utilitários compartilhados (logger, password).

---

## Conclusão
Este documento consolida o **processo de desenvolvimento** que agora inclui migrações centralizadas, configuração de paginação, gerenciamento de senhas, rate limiting e validação robusta. Seguir estas diretrizes garante código mais seguro, consistente e fácil de manter.
