# 📱💺 UCL Seats QRcode Viewer 💺📱   [![Create and publish a Docker image to GitHub Packages](https://github.com/ucl-casa-ce/ucl-seats-qrcode-viewer/actions/workflows/docker-image.yml/badge.svg)](https://github.com/ucl-casa-ce/ucl-seats-qrcode-viewer/actions/workflows/docker-image.yml)
A small webapp to show the UCL Seats code for the Lab on a shared screen automatically. Pairs to a Google Spreadsheet source to link and display the QRCode automatically.

## Endpoints
- Manual: Loads from provided classname and seats number
  - ```https://seats.cetools.org/CASA0017/999999```
- Manual:  Loads from provided seats number
  - ```https://seats.cetools.org/999999```
- Schedule:  Loads from Shared Google Spreadsheet 
  - ```https://seats.cetools.org/schedule```
