-- Substitui o anexo único do termo por dois anexos (recebimento e devolução)
ALTER TABLE tecnologia.equipamentos_pessoais
    DROP COLUMN IF EXISTS termo_arquivo_nome,
    DROP COLUMN IF EXISTS termo_arquivo_caminho,
    DROP COLUMN IF EXISTS termo_arquivo_mimetype,
    DROP COLUMN IF EXISTS termo_arquivo_enviado_em,
    ADD COLUMN IF NOT EXISTS termo_recebimento_nome text,
    ADD COLUMN IF NOT EXISTS termo_recebimento_caminho text,
    ADD COLUMN IF NOT EXISTS termo_recebimento_mimetype text,
    ADD COLUMN IF NOT EXISTS termo_recebimento_enviado_em timestamptz,
    ADD COLUMN IF NOT EXISTS termo_devolucao_nome text,
    ADD COLUMN IF NOT EXISTS termo_devolucao_caminho text,
    ADD COLUMN IF NOT EXISTS termo_devolucao_mimetype text,
    ADD COLUMN IF NOT EXISTS termo_devolucao_enviado_em timestamptz;
