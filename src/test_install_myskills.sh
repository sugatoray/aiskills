#!/usr/bin/bash

alias testbranch.create='git checkout -b trash/deleteme';
alias testbranch.delete='git stash -u && git checkout master && git branch -d trash/deleteme'; 
alias install.myskills='npx skills add sugatoray/aiskills --agent claude-code --yes && git stash -u';
alias test.install.myskills='testbranch.create && install.myskills && testbranch.delete';
alias test.loop.install.myskills='for i in $(seq ${TEST_LOOP_MAX:-10}); do test.install.myskills; done';
