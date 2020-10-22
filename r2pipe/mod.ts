export interface RunOption extends Deno.RunOptions {
    stdout: "piped",
    stdin: "piped",
    stderr: "null",
}

export interface CommandResponse {
    // deno-lint-ignore no-explicit-any
    [key: string]: any,
}

export class R2Pipe {
    private proc: Deno.Process<RunOption>;
    private encoder: TextEncoder;
    private decoder: TextDecoder;

    static async open(target: string, options?: string[]): Promise<R2Pipe> {
        const cmd = [
            "r2",
            "-q0",
            target,
        ];
        if (options) {
            cmd.concat(options);
        }

        let option: RunOption = {
            cmd: cmd,
            stdout: "piped",
            stdin: "piped",
            stderr: "null"
        };

        const proc = Deno.run(option);
        let buf = new Uint8Array(1);
        await proc.stdout.read(buf);
        return new R2Pipe(proc);
    }

    private constructor(proc: Deno.Process<RunOption>) {
        this.proc = proc;

        this.encoder = new TextEncoder();
        this.decoder = new TextDecoder();
    }

    async cmd(command: string): Promise<string> {
        if (!command.endsWith("\n")) {
            command += "\n";
        }
        const writed = await this.proc.stdin.write(this.encoder.encode(command));
        // console.log("writed (" + command + "): " + writed);

        let ret = "";
        let readLimit = 0x1000;
        let buf = new Uint8Array(readLimit);
        let readed: number | null = readLimit;
        while (1) {
            readed = await this.proc.stdout.read(buf);
            // console.log("readed: " + readed);
            if (readed === null) {
                /* EOF */
                break;
            }
            let splitIndex = buf.indexOf(0);
            let curRead = "";

            if (splitIndex == -1) {
                curRead = this.decoder.decode(buf.subarray(0, readed));
                ret += curRead;
            } else {
                /* we have a ending mark */
                curRead = this.decoder.decode(buf.subarray(0, splitIndex));
                ret += curRead;
                break;
            }
        }

        return ret;
    }

    async cmdJson(command: string): Promise<CommandResponse> {
        if (!command.endsWith("j")) {
            command += "j";
        }

        const outStr = await this.cmd(command);
        if (outStr.length === 0) {
            return {};
        }
        return JSON.parse(outStr);
    }

    async quit(): Promise<void> {
        await this.cmd("quit\n");
        this.proc.stdin.close();
        this.proc.stdout.close();
        this.proc.close();
    }
}