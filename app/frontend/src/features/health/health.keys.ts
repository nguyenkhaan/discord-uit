
export const HealthKey = {
    liveness: ["health"] as const, 
    list: () => [...HealthKey.liveness , "list"] as const
}

