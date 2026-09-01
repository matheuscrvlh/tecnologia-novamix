-- Código de identificação do aparelho (IMEI, número de série, etc.)
ALTER TABLE tecnologia.equipamentos
    ADD COLUMN IF NOT EXISTS codigo_aparelho text;
