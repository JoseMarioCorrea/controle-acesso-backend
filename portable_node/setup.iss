[Setup]
AppName=Controle Acesso
AppVersion=1.0.0
DefaultDirName={pf}\Controle Acesso
OutputBaseFilename=ControleAcesso_Installer
Compression=lzma
SolidCompression=yes
PrivilegesRequired=admin

[Languages]
Name: "portuguese"; MessagesFile: "compiler:Languages\Portuguese.isl"

[Dirs]
Name: "{app}\data"; Permissions: users-full

[Files]
Source: "C:\build\controle-acesso-backend\portable_node\*.*"; DestDir: "{app}\portable_node"; Flags: recursesubdirs createallsubdirs ignoreversion
Source: "C:\build\controle-acesso-backend\dist\*.*";       DestDir: "{app}\dist";        Flags: recursesubdirs createallsubdirs ignoreversion
Source: "C:\build\controle-acesso-backend\node_modules\*.*"; DestDir: "{app}\node_modules"; Flags: recursesubdirs createallsubdirs ignoreversion
Source: "C:\build\controle-acesso-backend\.env";            DestDir: "{app}\dist";        Flags: ignoreversion
Source: "C:\build\controle-acesso-frontend\dist\*.*";       DestDir: "{app}\dist\client"; Flags: recursesubdirs createallsubdirs ignoreversion
Source: "C:\build\controle-acesso-backend\data\*.*";        DestDir: "{app}\data";        Flags: recursesubdirs createallsubdirs ignoreversion
Source: "C:\build\controle-acesso-backend\uploads\*.*";     DestDir: "{app}\uploads";     Flags: recursesubdirs createallsubdirs ignoreversion

[Tasks]
Name: "desktopicon"; Description: "Criar atalho na Área de Trabalho"; Flags: unchecked

[Icons]
Name: "{group}\Iniciar Controle Acesso"; Filename: "{app}\dist\start.bat"; WorkingDir: "{app}\dist"
Name: "{commondesktop}\Controle Acesso"; Filename: "{app}\dist\start.bat"; Tasks: desktopicon; WorkingDir: "{app}\dist"

[Run]
Filename: "{app}\dist\start.bat"; Description: "Iniciar o Sistema agora"; Flags: nowait postinstall skipifsilent
