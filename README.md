# logseq-backup

Simple backup of logseq folder using free telegram cloud

## How to use

- create a .env file with 
  `TOKEN="your telegram token"
  GROUPID="your grup id"`
- add your bot in the selected group
- run `npm start` 
- in your group send `/backup` to start the backup and `/retrive` to retrive latest backup

## Modification

- you can change the repository that you want to backup modifing `send_backup` parameter
- `/retrive` take the latest backup, but you can change it calling `retrive_backup` with another second parameter

## Improvement

- possibilty to backup of multiple folders
- create api with express
- reorganize files
- add external script to backup