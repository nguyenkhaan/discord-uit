import { Router } from "express";

export class ReadinessState {
    private ready = false;

    isReady(): boolean {
        return this.ready;
    }

    markReady(): void {
        this.ready = true;
    }

    markNotReady(): void {
        this.ready = false;
    }
}

export function createHealthRouter(readiness: ReadinessState): Router {
    const router = Router();

    router.get("/live", (_request, response) => {
        response.status(200).json({
            status: "UP",
        });
    });

    router.get("/ready", (_request, response) => {
        if (!readiness.isReady()) {
            response.status(503).json({
                status: "STARTING",
            });
            return;
        }

        response.status(200).json({
            status: "UP",
        });
    });

    return router;
}
