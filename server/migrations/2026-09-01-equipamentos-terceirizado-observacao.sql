-- Suporte a equipamentos terceirizados (sem patrimônio/código do aparelho) e campo de observação livre
ALTER TABLE tecnologia.equipamentos
    ADD COLUMN IF NOT EXISTS observacao text,
    ADD COLUMN IF NOT EXISTS terceirizado boolean NOT NULL DEFAULT false;

ALTER TABLE tecnologia.equipamentos
    ALTER COLUMN patrimonio DROP NOT NULL;
