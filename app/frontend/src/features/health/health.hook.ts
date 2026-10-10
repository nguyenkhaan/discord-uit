import { useMutation, useQuery } from "@tanstack/react-query";
import { getHealthLiveness } from "./health.service";

export function useGetHealthLivenessQuery() {
    return useQuery({
        queryKey: ["health"],
        queryFn: getHealthLiveness
    })
}
export function useCreateSomethingMutation() {
    return useMutation({
        mutationKey: ["key-name"], 
        mutationFn: undefined //service function
    })
} 