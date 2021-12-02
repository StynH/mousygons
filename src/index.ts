import _ from "lodash";

type MousePosition = {
    x: number;
    y: number;
}

type Canvas = {
    element: HTMLCanvasElement,
    context: CanvasRenderingContext2D,
    width: number,
    height: number
}

type RGB = {
    r: number;
    g: number;
    b: number;
}

class Point{
    private static readonly ALPHA_THRESHOLD: number = 255;

    private x: number;
    private y: number;
    private dimensions: number;
    private alpha: number;
    private readonly alphaSpeed: number;
    private satisfied: boolean;

    constructor(x: number, y: number, dimensions: number, alphaSpeed: number) {
        this.x = x;
        this.y = y;
        this.dimensions = dimensions;
        this.alpha = 0.0;
        this.alphaSpeed = alphaSpeed;
        this.satisfied = false;
    }

    public getX(): number{
        return this.x;
    }

    public getY(): number{
        return this.y;
    }

    public getDimensions(): number{
        return this.dimensions;
    }

    public isSatisfied(): boolean{
        return this.satisfied;
    }

    public getAlpha(): number{
        return this.alpha;
    }

    public distanceToCoords(x: number, y: number): number{
        const a = this.x - x;
        const b = this.y - y;
        return Math.sqrt(a * a + b * b);
    }

    public distanceTo(point: Point): number{
        const a = this.x - point.x;
        const b = this.y - point.y;
        return Math.sqrt(a * a + b * b);
    }

    public update(): void{
        if(!this.satisfied){
            this.alpha += this.alphaSpeed;
            if(this.alpha >= Point.ALPHA_THRESHOLD){
                this.satisfied = true;
            }
        }
    }
}

export class Mousygons{
    private static readonly MAX_POINTS_ALIVE: number = 6;
    private static readonly MOUSE_WIDTH: number = 12;
    private static readonly MOUSE_HEIGHT: number = 20;
    private static readonly CANVAS_WIDTH: number = 64;
    private static readonly CANVAS_HEIGHT: number = 64;
    private static readonly FADE_MIN: number = 0.25;
    private static readonly FADE_MAX: number = 1.75;

    private mousePosition: MousePosition;
    private mouseCanvas: JQuery<HTMLCanvasElement> | null;
    private canvas: Canvas | null;
    private readonly interval: number;
    private points: Point[];

    constructor() {
        this.mousePosition = { x: 0, y: 0 };
        this.mouseCanvas = null;
        this.canvas = null;
        this.interval = 1000 / 144;
        this.points = [];

        this.createMouseCanvas();
        document.onmousemove = this.mouseMovementHandler.bind(this);
        this.updateMouseCanvas();
    }

    start(): void{
        setInterval(this.update.bind(this), this.interval);
    }

    private update(): void{
        this.clearCanvas();
        this.fillPoints();
        this.updatePoints();
        this.drawPoints();
    }

    private createMouseCanvas(): void{
        const body = $("body");
        this.mouseCanvas = $("<canvas width='64' height='64'></canvas>");

        const c = <HTMLCanvasElement>this.mouseCanvas.get(0);
        const ctx = c.getContext("2d")!;

        this.canvas = { element: c, context: ctx, width: c.width, height: c.height };
        body.append(this.mouseCanvas);
    }

    private mouseMovementHandler(event: MouseEvent): void {
        this.mousePosition = {
            x: event.pageX,
            y: event.pageY
        };
        this.updateMouseCanvas();
    };

    private updateMouseCanvas(): void {
        this.mouseCanvas?.css({
            left: this.mousePosition.x - (Mousygons.CANVAS_WIDTH / 2) + (Mousygons.MOUSE_WIDTH / 2),
            top: this.mousePosition.y - (Mousygons.CANVAS_HEIGHT / 2) + (Mousygons.MOUSE_HEIGHT / 2),
            position: "absolute",
            pointerEvents: "none"
        });
    }

    private clearCanvas(): void{
        this.canvas!.context.clearRect(0, 0, Mousygons.CANVAS_WIDTH, Mousygons.CANVAS_HEIGHT);
    }

    private fillPoints(): void{
        while(this.points.length < Mousygons.MAX_POINTS_ALIVE){
            const point = this.createPoint();
            this.points.push(point);
        }
    }

    private updatePoints(): void{
        for(let i = 0; i < this.points.length; ++i){
            const point = this.points[i];
            point.update();

            if(point.isSatisfied()){
                this.points.splice(i, 1);
            }
        }
    }

    private drawPoints(): void{
        _.forEach(this.points, (point: Point) => {
            const rgb = Mousygons.hexToRgb("#00bf9b")!;
            this.canvas!.context.fillStyle = "rgba(" + rgb.r + "," + rgb.g + "," + rgb.b + "," + (point.getAlpha() / 255) + " )";
            this.canvas!.context.beginPath();
            this.canvas!.context.fillRect(point.getX() - (point.getDimensions() / 2), point.getY() - (point.getDimensions()  / 2), point.getDimensions(), point.getDimensions());
            this.canvas!.context.stroke();
        });
    }

    private createPoint(): Point{
        let foundPosition = false;
        while(!foundPosition){
            const dimensions = Mousygons.randomIntBetween(2, 4);
            const positionX = Mousygons.randomIntBetween(dimensions, Mousygons.CANVAS_WIDTH - (dimensions / 2));
            const positionY = Mousygons.randomIntBetween(dimensions, Mousygons.CANVAS_HEIGHT - (dimensions / 2));

            let positionConflict = false;
            _.forEach(this.points, (point: Point) => {
                if(point.distanceToCoords(positionX, positionY) <= (dimensions * 6)){
                    positionConflict = true;
                    return false;
                }
            });

            foundPosition = !positionConflict;
            if(foundPosition){
                return new Point(positionX, positionY, dimensions, Mousygons.randomFloatBetween(Mousygons.FADE_MIN, Mousygons.FADE_MAX));
            }
        }

        return new Point(0, 0, 0, 0);
    }

    static randomIntBetween(min: number, max: number): number{
        return Math.floor(Math.random() * (max - min + 1) + min)
    }

    static randomFloatBetween(min: number, max: number): number{
        return (Math.random() * (max - min) + min);
    }

    static hexToRgb(hex: string): RGB | null {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }
}
