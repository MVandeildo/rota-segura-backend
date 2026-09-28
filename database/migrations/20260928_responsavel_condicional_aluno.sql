BEGIN;

ALTER TABLE alunos
    ALTER COLUMN responsavel_id DROP NOT NULL;

CREATE OR REPLACE FUNCTION validar_responsavel_aluno_menor()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.data_nascimento > (CURRENT_DATE - INTERVAL '18 years')::date
       AND NEW.responsavel_id IS NULL THEN
        RAISE EXCEPTION USING
            ERRCODE = '23514',
            CONSTRAINT = 'alunos_responsavel_menor_check',
            MESSAGE = 'Aluno menor de 18 anos deve ter um responsável vinculado.';
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS alunos_validar_responsavel_menor ON alunos;

CREATE TRIGGER alunos_validar_responsavel_menor
BEFORE INSERT OR UPDATE OF data_nascimento, responsavel_id ON alunos
FOR EACH ROW
EXECUTE FUNCTION validar_responsavel_aluno_menor();

COMMIT;
