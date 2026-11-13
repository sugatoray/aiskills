# Repository maintenance. `make help` lists the targets.
# The logic lives in scripts/; these targets only pass arguments through.

SHELL := bash
.DEFAULT_GOAL := help
.PHONY: help link-skills check-skill-links test-scripts

help: ## List the targets
	@echo "make link-skills SKILL=<path> [DRY_RUN=1] [FORCE=1]"
	@echo "    link the skill at <path>, or every skill below it (e.g. skills/scrolls),"
	@echo "    into .agents/skills/ and .claude/skills/ as relative symlinks"
	@echo "make check-skill-links"
	@echo "    check that every skill link resolves to a skill with the same name"
	@echo "make test-scripts"
	@echo "    run the tests for scripts/"

link-skills: ## Link skills into .agents/skills and .claude/skills
	@if [ -z "$(SKILL)" ]; then echo "make link-skills: give SKILL=<path>, e.g. SKILL=skills/scrolls" >&2; exit 2; fi
	@bash scripts/link-skills.sh $(if $(DRY_RUN),--dry-run) $(if $(FORCE),--force) $(SKILL)

check-skill-links: ## Verify every skill link
	@bash scripts/link-skills.sh --check

test-scripts: ## Run the tests for scripts/
	@bash scripts/tests/test_link_skills.sh
