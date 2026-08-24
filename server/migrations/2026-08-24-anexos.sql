-- Adiciona suporte a anexos (nota fiscal, contrato, termo assinado)
ALTER TABLE tecnologia.gastos
    ADD COLUMN IF NOT EXISTS arquivo_nome text,
    ADD COLUMN IF NOT EXISTS arquivo_caminho text,
    ADD COLUMN IF NOT EXISTS arquivo_mimetype text,
    ADD COLUMN IF NOT EXISTS arquivo_enviado_em timestamptz;

ALTER TABLE tecnologia.contratos
    ADD COLUMN IF NOT EXISTS arquivo_nome text,
    ADD COLUMN IF NOT EXISTS arquivo_caminho text,
    ADD COLUMN IF NOT EXISTS arquivo_mimetype text,
    ADD COLUMN IF NOT EXISTS arquivo_enviado_em timestamptz;

ALTER TABLE tecnologia.equipamentos_pessoais
    ADD COLUMN IF NOT EXISTS termo_arquivo_nome text,
    ADD COLUMN IF NOT EXISTS termo_arquivo_caminho text,
    ADD COLUMN IF NOT EXISTS termo_arquivo_mimetype text,
    ADD COLUMN IF NOT EXISTS termo_arquivo_enviado_em timestamptz;
