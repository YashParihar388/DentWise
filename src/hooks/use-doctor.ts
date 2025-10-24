"use client"

import { createDoctor, getDoctors, UpdateDoctor } from "@/lib/actions/doctors"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

export function useGetDoctors(){
    const result = useQuery({
        queryKey:["getDoctors"],
        queryFn: getDoctors
    }) 

    return result;
}

export function useCreateDoctors(){
    const queryClient = useQueryClient();
    const result=useMutation({
        mutationFn:createDoctor,
        onSuccess:()=>{
            //invalidate the related queries to reefresh the data without manually refreshingc
            queryClient.invalidateQueries({queryKey:["getDoctors"]});
        },
        onError:(error)=>console.log("Error while creating doctor",error),

    })

    return result
}
export function useUpdateDoctors(){
    const queryClient = useQueryClient();
    const result=useMutation({
        mutationFn:UpdateDoctor,
        onSuccess:()=>{
            //invalidate the related queries to reefresh the data without manually refreshingc
            queryClient.invalidateQueries({queryKey:["getDoctors"]});
        },
        onError:(error)=>console.log("Error while creating doctor",error),

    })

    return result
}