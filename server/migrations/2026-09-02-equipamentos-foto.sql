-- Foto do equipamento (upload no cadastro/edição)
ALTER TABLE tecnologia.equipamentos
    ADD COLUMN IF NOT EXISTS foto_nome text,
    ADD COLUMN IF NOT EXISTS foto_caminho text,
    ADD COLUMN IF NOT EXISTS foto_mimetype text,
    ADD COLUMN IF NOT EXISTS foto_enviado_em timestamptz;
