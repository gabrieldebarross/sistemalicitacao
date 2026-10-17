# Implantação e Recuperação

> Documento inicial (Fase 0). Completo na Fase 12.

## Ambientes

- **Desenvolvimento** (local).
- **Homologação**.
- **Produção**.

Credenciais distintas por ambiente. Banco de desenvolvimento nunca é produção.

## Docker (previsto)

- Imagens multi-stage; containers sem root quando possível.
- Nenhum arquivo `.env` ou segredo na imagem.
- Volume persistente para MySQL; health checks; políticas de reinício.
- Portas restritas; banco não exposto à internet; redes internas.
- Proxy reverso com HTTPS quando apropriado.

## CI/CD (previsto)

Instalação reproduzível → formatação → lint → tipos → testes → build →
verificação de vulnerabilidades → verificação de segredos → build de imagens.
Deploy depende de aprovação. Sem segredos no YAML.

## Banco em produção

- Migrations testadas em homologação antes da produção.
- Backup antes de migrações de risco; credenciais mínimas; recuperação testada.
- Migrações compatíveis com a versão anterior durante o deploy (expand/contract).
- Operações destrutivas nunca automáticas.

## Observabilidade (previsto)

Logs estruturados, identificadores de correlação, métricas de saúde,
monitoramento de erros/disponibilidade, alertas e política de retenção — sem
registrar dados sensíveis.

## Pendências

- Provedor de hospedagem e topologia de rede.
- Estratégia de backup/restauração e RPO/RTO.
- Ferramenta de CI/CD e de monitoramento.
