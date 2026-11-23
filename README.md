# Tauri + React

This template should help get you started developing with Tauri and React in Vite.

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)

## Carga de registros desde una tarjeta SD

Desde el historial de un paciente o desde **Cargar registros**, selecciona la carpeta de la tarjeta SD. La aplicación busca archivos CSV con `ID_CLINICO` igual al ID interno del paciente. Si no encuentra uno, puedes asignarle un CSV de la carpeta; sus campos `PACIENTE` e `ID_CLINICO` se actualizan. Si todavía no hay archivo, puedes crear un CSV inicial para el dispositivo.

Las filas `REF` y `AFE` se agrupan por número de sesión. Las sesiones que contengan solo uno de los dos tipos también se importan. Antes de guardar, la aplicación muestra las sesiones con número mayor que `ULTIMO_SUBIDO` para confirmar la carga. Las impedancias se conservan en bruto y ambas series comparten los mismos ejes: una usa la REF de la sesión o la REF anterior más cercana, y otra compara cada AFE con una REF fija seleccionada con la estrella. Tras una carga exitosa se actualiza `ULTIMO_SUBIDO` en el CSV.
