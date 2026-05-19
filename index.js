import { join, dirname } from 'path';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import cluster from 'cluster';
import { watchFile, unwatchFile } from 'fs';
import cfonts from 'cfonts';
import { createInterface } from 'readline';
import yargs from 'yargs';
import chalk from 'chalk';

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

const { name, description, author, version } = require(join(__dirname, './package.json'));

const { say } = cfonts;
const rl = createInterface(process.stdin, process.stdout);

console.log(chalk.cyan(`\nIniciando \( {name} v \){version}`));

// Banner
say('PAPACITO\nbot\nShadow', {
    font: 'chrome',
    align: 'center',
    gradient: ['red', 'magenta']
});

say(`Developed By Dev.Criss 🇦🇱`, {
    font: 'console',
    align: 'center',
    gradient: ['red', 'magenta']
});

let isRunning = false;

function start(file) {
    if (isRunning) return;
    isRunning = true;

    const args = [join(__dirname, file), ...process.argv.slice(2)];

    console.log(chalk.yellow(`[START] Ejecutando: ${process.argv[0]} ${args.join(' ')}`));

    // Configuración del cluster (forma moderna)
    cluster.setupPrimary({
        exec: args[0],
        args: args.slice(1),
    });

    const worker = cluster.fork();

    worker.on('message', (data) => {
        if (data === 'reset') {
            worker.process.kill();
            isRunning = false;
            start(file);
        } else if (data === 'uptime') {
            worker.send(process.uptime());
        }
    });

    worker.on('exit', (code) => {
        isRunning = false;
        console.error(chalk.red(`❌ Worker finalizado con código: ${code}`));

        if (code === 0) return;

        // Reinicio automático al detectar cambios
        watchFile(args[0], () => {
            unwatchFile(args[0]);
            start(file);
        });
    });

    // Manejo de comandos por consola
    const opts = yargs(process.argv.slice(2)).exitProcess(false).parse();
    if (!opts['test'] && !rl.listenerCount('line')) {
        rl.on('line', (line) => {
            if (worker.send) worker.send(line.trim());
        });
    }
}

// Advertencia de listeners
process.on('warning', (warning) => {
    if (warning.name === 'MaxListenersExceededWarning') {
        console.warn(chalk.red('🔴 Se excedió el límite de listeners:'));
        console.warn(warning.stack);
    }
});

// Iniciar el bot
start('main.js');