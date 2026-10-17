# Lorcana Collection

Aplicativo responsivo em português para organizar cartas Disney Lorcana: catálogo, pesquisa, filtros por coleção/tinta/raridade, quantidades, lista de desejos e backup JSON.

## Desenvolvimento
```bash
npm install
npm run dev
```

## Build web
```bash
npm run build
```

## APK Android
O GitHub Actions compila um APK de depuração automaticamente em cada push para `main`. Abra a aba **Actions**, selecione **Build Android APK** e baixe o artefato `lorcana-collection-debug-apk` quando a execução terminar.

Os dados da coleção são salvos localmente no dispositivo. O catálogo tenta carregar a fonte pública LorcanaJSON e oferece uma demonstração se estiver indisponível.

Aviso: projeto independente, sem afiliação com Disney ou Ravensburger. As marcas e imagens pertencem aos respectivos proprietários.