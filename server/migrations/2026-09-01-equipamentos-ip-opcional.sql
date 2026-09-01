-- Permite cadastrar equipamentos sem IP (nem todo equipamento tem IP fixo)
ALTER TABLE tecnologia.equipamentos
    ALTER COLUMN ip DROP NOT NULL;
