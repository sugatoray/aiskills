# Repository maintenance. `make help` lists the targets.
# The logic lives in scripts/; these targets only pass arguments through.

SHELL := bash
.DEFAULT_GOAL := help
.PHONY: help link-skills check-skill-links test-scripts conda setup-pwsh

help: ## List the targets
	@echo "make link-skills SKILL=<path> [DRY_RUN=1] [FORCE=1]"
	@echo "    link the skill at <path>, or every skill below it (e.g. skills/scrolls),"
	@echo "    into .agents/skills/ and .claude/skills/ as relative symlinks"
	@echo "make check-skill-links"
	@echo "    check that every skill link resolves to a skill with the same name"
	@echo "make test-scripts"
	@echo "    run the tests for scripts/"
	@echo "make conda [CONDA_DIR=<dir>] [DRY_RUN=1]"
	@echo "    install conda (Miniforge, conda-forge) in ~/miniforge3 unless one is already there"
	@echo "make setup-pwsh [CONDA_DIR=<dir>] [PWSH_ENV=<dir>] [DRY_RUN=1]"
	@echo "    install PowerShell (pwsh) from conda-forge, and conda first if needed"

link-skills: ## Link skills into .agents/skills and .claude/skills
	@if [ -z "$(SKILL)" ]; then echo "make link-skills: give SKILL=<path>, e.g. SKILL=skills/scrolls" >&2; exit 2; fi
	@bash scripts/link-skills.sh $(if $(DRY_RUN),--dry-run) $(if $(FORCE),--force) $(SKILL)

check-skill-links: ## Verify every skill link
	@bash scripts/link-skills.sh --check

test-scripts: ## Run the tests for scripts/
	@bash scripts/tests/test_link_skills.sh
	@bash scripts/tests/test_setup_tools.sh

conda: ## Install conda (Miniforge) unless one is already there
	@$(if $(CONDA_DIR),CONDA_DIR="$(CONDA_DIR)") bash scripts/setup-conda.sh $(if $(DRY_RUN),--dry-run)

setup-pwsh: ## Install PowerShell from conda-forge (and conda if needed)
	@$(if $(CONDA_DIR),CONDA_DIR="$(CONDA_DIR)") $(if $(PWSH_ENV),PWSH_ENV="$(PWSH_ENV)") bash scripts/setup-pwsh.sh $(if $(DRY_RUN),--dry-run)
