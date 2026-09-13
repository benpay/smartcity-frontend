import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";

interface User {
    id: string;
    email: string;
}

const fetchMe = async (): Promise<User> => {
    const { data } = await api.get('/me');
    return data;
}

export function useAuth(){
    const queryClient = useQueryClient();

    const { data: user, isLoading } = useQuery({
        queryKey: ['me'],
        queryFn: fetchMe,
        retry: false
    });

    const loginMutation = useMutation({
        mutationFn: (credentials: { email: string; password: string }) =>
            api.post('/login', credentials),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['me']})
    });

    const logoutMutation = useMutation({
        mutationFn: () => api.post('/logout'),
        onSuccess: () => queryClient.setQueryData(['me'], null)
    });

    return {
        user,
        isLoading,
        isAuthenticated: !!user,
        login: loginMutation.mutateAsync,
        logout: logoutMutation.mutateAsync,
        loginError: loginMutation.error,
        isLoggingIn: loginMutation.isPending
    };
}