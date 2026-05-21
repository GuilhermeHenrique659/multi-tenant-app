#!/bin/sh

# Executa as migrações do Drizzle
echo "Rodando migrações do banco de dados..."
npx drizzle-kit push # ou 'npm run migration:run' se você tiver um script customizado
npx drizzle-kit generate # ou 'npm run migration:run' se você tiver um script customizado
npx drizzle-kit migrate # ou 'npm run migration:run' se você tiver um script customizado

# Inicia a aplicação Express
echo "Iniciando o servidor..."
exec npm run start