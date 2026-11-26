using System;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Net;
using System.Reflection;
using System.Text;
using System.Windows.Forms;

namespace Lobster
{
    // Lanzador de Lobster: arranca el runtime Node incluido (sin instalar nada),
    // abre el panel en el navegador y permite detenerlo.
    static class Program
    {
        static string BaseDir { get { return AppDomain.CurrentDomain.BaseDirectory; } }
        static string NodeExe { get { return Path.Combine(BaseDir, "runtime", "node.exe"); } }
        static string ServerJs { get { return Path.Combine(BaseDir, "apps", "server", "dist", "index.js"); } }
        static string ServerDir { get { return Path.Combine(BaseDir, "apps", "server"); } }
        static string ConfigPath { get { return Path.Combine(BaseDir, "config.ini"); } }
        static string LogDir { get { return Path.Combine(BaseDir, "logs"); } }
        static string LogPath { get { return Path.Combine(LogDir, "lobster.log"); } }
        const string Url = "http://localhost:3000/";

        static Process server;

        [STAThread]
        static void Main(string[] args)
        {
            // Modo silencioso para automatizar/prbar: Lobster.exe --crear-acceso-directo [ruta]
            if (args.Length > 0 && args[0] == "--crear-acceso-directo")
            {
                string destino = args.Length > 1 && args[1].Length > 0
                    ? args[1]
                    : Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.DesktopDirectory), "Lobster.lnk");
                try
                {
                    CrearAccesoDirecto(destino);
                    File.WriteAllText(Path.Combine(BaseDir, "acceso-directo.txt"), "OK " + destino, new UTF8Encoding(false));
                    Environment.Exit(0);
                }
                catch (Exception ex)
                {
                    File.WriteAllText(Path.Combine(BaseDir, "acceso-directo.txt"), "ERROR " + ex.Message, new UTF8Encoding(false));
                    Environment.Exit(1);
                }
                return;
            }

            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);

            if (!File.Exists(NodeExe) || !File.Exists(ServerJs))
            {
                MessageBox.Show(
                    "Faltan archivos del programa.\r\n\r\nSe esperaba:\r\n  " + NodeExe + "\r\n  " + ServerJs +
                    "\r\n\r\nDescomprimi el ZIP completo antes de ejecutar Lobster.exe.",
                    "Lobster", MessageBoxButtons.OK, MessageBoxIcon.Error);
                return;
            }

            if (string.IsNullOrWhiteSpace(LeerConfig("LLM_API_KEY")) && string.IsNullOrWhiteSpace(LeerConfig("MOTOR_LOCAL")))
            {
                if (!PedirClave()) return;
            }

            Directory.CreateDirectory(LogDir);
            Application.Run(new Ventana());
        }

        /// <summary>Crea un acceso directo .lnk que apunta a este mismo ejecutable.</summary>
        public static void CrearAccesoDirecto(string ruta)
        {
            Type shellType = Type.GetTypeFromProgID("WScript.Shell");
            if (shellType == null) throw new Exception("WScript.Shell no disponible en este Windows");
            object shell = Activator.CreateInstance(shellType);
            object lnk = shellType.InvokeMember("CreateShortcut", BindingFlags.InvokeMethod, null, shell, new object[] { ruta });
            Type t = lnk.GetType();
            t.InvokeMember("TargetPath", BindingFlags.SetProperty, null, lnk, new object[] { Application.ExecutablePath });
            t.InvokeMember("WorkingDirectory", BindingFlags.SetProperty, null, lnk, new object[] { BaseDir });
            t.InvokeMember("IconLocation", BindingFlags.SetProperty, null, lnk, new object[] { Application.ExecutablePath + ",0" });
            t.InvokeMember("Description", BindingFlags.SetProperty, null, lnk, new object[] { "Lobster - asistente de IA local" });
            t.InvokeMember("Save", BindingFlags.InvokeMethod, null, lnk, null);
        }

        static string LeerConfig(string clave)
        {
            try
            {
                if (!File.Exists(ConfigPath)) return null;
                foreach (string linea in File.ReadAllLines(ConfigPath, Encoding.UTF8))
                {
                    string l = linea.Trim();
                    if (l.Length == 0 || l.StartsWith("#") || l.StartsWith(";")) continue;
                    int i = l.IndexOf('=');
                    if (i <= 0) continue;
                    if (l.Substring(0, i).Trim().Equals(clave, StringComparison.OrdinalIgnoreCase))
                        return l.Substring(i + 1).Trim().Trim('"');
                }
            }
            catch { }
            return null;
        }

        static void GuardarConfig(string clave, string valor)
        {
            var lineas = new System.Collections.Generic.List<string>();
            bool escrito = false;
            if (File.Exists(ConfigPath))
            {
                foreach (string l in File.ReadAllLines(ConfigPath, Encoding.UTF8))
                {
                    if (l.TrimStart().StartsWith(clave + "=", StringComparison.OrdinalIgnoreCase))
                    {
                        lineas.Add(clave + "=" + valor);
                        escrito = true;
                    }
                    else lineas.Add(l);
                }
            }
            if (!escrito) lineas.Add(clave + "=" + valor);
            File.WriteAllLines(ConfigPath, lineas.ToArray(), new UTF8Encoding(false));
        }

        // Primera ejecucion: pide la clave gratuita (opcional).
        static bool PedirClave()
        {
            using (var f = new Form())
            {
                f.Text = "Lobster - primer arranque";
                f.FormBorderStyle = FormBorderStyle.FixedDialog;
                f.StartPosition = FormStartPosition.CenterScreen;
                f.MaximizeBox = false; f.MinimizeBox = false;
                f.ClientSize = new Size(560, 262);
                f.BackColor = Color.FromArgb(18, 18, 22);
                f.ForeColor = Color.White;

                var titulo = new Label
                {
                    Text = "Pega tu clave gratuita de Google AI Studio (opcional)",
                    Font = new Font("Segoe UI", 12F, FontStyle.Bold),
                    ForeColor = Color.White,
                    Location = new Point(20, 18),
                    Size = new Size(520, 28)
                };
                var ayuda = new Label
                {
                    Text = "1) Entra a aistudio.google.com  ->  Get API key  ->  crea una clave\r\n" +
                           "2) Pegala abajo y guarda. Es gratis (~1.500 pedidos por dia).\r\n\r\n" +
                           "Si lo dejas vacio, Lobster usa el motor local (mas lento).",
                    Font = new Font("Segoe UI", 9F),
                    ForeColor = Color.FromArgb(170, 170, 180),
                    Location = new Point(20, 52),
                    Size = new Size(520, 90)
                };
                var caja = new TextBox
                {
                    Location = new Point(20, 150),
                    Size = new Size(520, 26),
                    Font = new Font("Consolas", 10F),
                    UseSystemPasswordChar = true
                };
                var guardar = new Button
                {
                    Text = "Guardar y arrancar",
                    DialogResult = DialogResult.OK,
                    Location = new Point(330, 195),
                    Size = new Size(160, 34)
                };
                var sinClave = new Button
                {
                    Text = "Usar motor local",
                    DialogResult = DialogResult.Cancel,
                    Location = new Point(20, 195),
                    Size = new Size(150, 34)
                };

                f.Controls.AddRange(new Control[] { titulo, ayuda, caja, guardar, sinClave });
                DialogResult r = f.ShowDialog();

                if (r == DialogResult.OK && caja.Text.Trim().Length > 0)
                {
                    GuardarConfig("LLM_API_KEY", caja.Text.Trim());
                    GuardarConfig("LLM_BASE_URL", "https://generativelanguage.googleapis.com/v1beta/openai");
                    GuardarConfig("LLM_MODEL", "gemini-3.1-flash-lite");
                    GuardarConfig("LLM_VISION_MODEL", "gemini-3.1-flash-lite");
                    return true;
                }
                GuardarConfig("MOTOR_LOCAL", "1");
                return true;
            }
        }

        public static bool ServidorResponde(int timeoutMs)
        {
            try
            {
                var req = (HttpWebRequest)WebRequest.Create(Url);
                req.Timeout = timeoutMs;
                req.Method = "HEAD";
                using (var resp = (HttpWebResponse)req.GetResponse()) return true;
            }
            catch { return false; }
        }

        public static void Arrancar()
        {
            if (server != null && !server.HasExited) return;

            var psi = new ProcessStartInfo(NodeExe, "\"" + ServerJs + "\"");
            psi.WorkingDirectory = ServerDir;
            psi.UseShellExecute = false;
            psi.CreateNoWindow = true;
            psi.RedirectStandardOutput = true;
            psi.RedirectStandardError = true;
            psi.EnvironmentVariables["NODE_ENV"] = "production";
            psi.EnvironmentVariables["PORT"] = "3000";

            string clave = LeerConfig("LLM_API_KEY");
            string baseUrl = LeerConfig("LLM_BASE_URL");
            string modelo = LeerConfig("LLM_MODEL");
            string vision = LeerConfig("LLM_VISION_MODEL");
            if (!string.IsNullOrWhiteSpace(clave)) psi.EnvironmentVariables["LLM_API_KEY"] = clave;
            if (!string.IsNullOrWhiteSpace(baseUrl)) psi.EnvironmentVariables["LLM_BASE_URL"] = baseUrl;
            if (!string.IsNullOrWhiteSpace(modelo)) psi.EnvironmentVariables["LLM_MODEL"] = modelo;
            if (!string.IsNullOrWhiteSpace(vision)) psi.EnvironmentVariables["LLM_VISION_MODEL"] = vision;

            server = new Process();
            server.StartInfo = psi;
            server.OutputDataReceived += (s, e) => { if (e.Data != null) Registrar(e.Data); };
            server.ErrorDataReceived += (s, e) => { if (e.Data != null) Registrar(e.Data); };
            server.Start();
            server.BeginOutputReadLine();
            server.BeginErrorReadLine();
        }

        static readonly object candado = new object();
        static void Registrar(string linea)
        {
            try
            {
                lock (candado) File.AppendAllText(LogPath, linea + Environment.NewLine, new UTF8Encoding(false));
            }
            catch { }
        }

        public static void Detener()
        {
            try
            {
                if (server != null && !server.HasExited)
                {
                    server.Kill();
                    server.WaitForExit(4000);
                }
            }
            catch { }
            server = null;
        }

        public static bool Corriendo { get { return server != null && !server.HasExited; } }
    }

    class Ventana : Form
    {
        readonly Label estado;
        readonly Button abrir, detener;
        readonly Timer timer;
        bool yaAbierto;

        public Ventana()
        {
            Text = "Lobster";
            ClientSize = new Size(560, 200);
            FormBorderStyle = FormBorderStyle.FixedSingle;
            MaximizeBox = false;
            StartPosition = FormStartPosition.CenterScreen;
            BackColor = Color.FromArgb(18, 18, 22);
            ForeColor = Color.White;

            var logo = new Label
            {
                Text = "Lobster",
                Font = new Font("Segoe UI", 20F, FontStyle.Bold),
                ForeColor = Color.FromArgb(249, 115, 22),
                Location = new Point(20, 14),
                Size = new Size(300, 40)
            };
            estado = new Label
            {
                Text = "Arrancando...",
                Font = new Font("Segoe UI", 9F),
                ForeColor = Color.FromArgb(180, 180, 190),
                Location = new Point(22, 62),
                Size = new Size(416, 40)
            };
            abrir = new Button
            {
                Text = "Abrir panel",
                Location = new Point(22, 120),
                Size = new Size(150, 40),
                Enabled = false
            };
            abrir.Click += (s, e) => { try { Process.Start("http://localhost:3000/"); } catch { } };

            var atajo = new Button
            {
                Text = "Acceso directo",
                Location = new Point(182, 120),
                Size = new Size(160, 40)
            };
            atajo.Click += (s, e) =>
            {
                try
                {
                    string ruta = Path.Combine(
                        Environment.GetFolderPath(Environment.SpecialFolder.DesktopDirectory), "Lobster.lnk");
                    Program.CrearAccesoDirecto(ruta);
                    MessageBox.Show("Listo: se creo \"Lobster\" en el escritorio.", "Lobster",
                        MessageBoxButtons.OK, MessageBoxIcon.Information);
                }
                catch (Exception ex)
                {
                    MessageBox.Show("No se pudo crear el acceso directo:\r\n" + ex.Message, "Lobster",
                        MessageBoxButtons.OK, MessageBoxIcon.Warning);
                }
            };

            detener = new Button
            {
                Text = "Detener y salir",
                Location = new Point(352, 120),
                Size = new Size(186, 40)
            };
            detener.Click += (s, e) =>
            {
                Program.Detener();
                yaAbierto = true;
                Close();
            };

            Controls.AddRange(new Control[] { logo, estado, abrir, atajo, detener });

            Shown += (s, e) =>
            {
                try
                {
                    if (!Program.ServidorResponde(800)) Program.Arrancar();
                }
                catch (Exception ex)
                {
                    MessageBox.Show("No se pudo iniciar el servidor:\r\n" + ex.Message, "Lobster");
                }
            };

            timer = new Timer { Interval = 1000 };
            timer.Tick += (s, e) =>
            {
                bool ok = Program.ServidorResponde(600);
                abrir.Enabled = ok;
                if (ok)
                {
                    estado.Text = "Corriendo en http://localhost:3000";
                    if (!yaAbierto)
                    {
                        yaAbierto = true;
                        try { Process.Start("http://localhost:3000/"); } catch { }
                    }
                }
                else
                {
                    estado.Text = Program.Corriendo
                        ? "Arrancando... (la primera vez tarda unos segundos)"
                        : "El servidor no esta corriendo. Revisa logs\\lobster.log";
                }
            };
            timer.Start();

            FormClosing += (s, e) =>
            {
                if (yaAbierto && !Program.Corriendo) return;
                var r = MessageBox.Show("Detener Lobster y cerrar?", "Lobster", MessageBoxButtons.YesNo, MessageBoxIcon.Question);
                if (r == DialogResult.Yes) Program.Detener();
                else e.Cancel = true;
            };
        }
    }
}
