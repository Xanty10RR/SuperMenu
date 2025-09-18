    import React, { useEffect, useState } from 'react';

    interface Pokemon {
    name: string;
    sprites: {
        front_default: string;
    };
    abilities: {
        ability: {
        name: string;
        };
    }[];
    }

    export const PokeApiComponent: React.FC = () => {
    const [pokemon, setPokemon] = useState<Pokemon | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
    const fetchPokemon = async () => {
        try {
        const response = await fetch('https://pokeapi.co/api/v2/pokemon/pikachu');
        if (!response.ok) {
            throw new Error('No se pudo obtener el Pokémon');
        }
        const data: Pokemon = await response.json();
        setPokemon(data);
        } catch (err) {
        // Verificación de tipo
        if (err instanceof Error) {
            setError(err.message);
        } else {
            setError('Ocurrió un error desconocido');
        }
        } finally {
        setLoading(false);
        }
    };

    fetchPokemon();
    }, []);

    if (loading) return <div>Cargando...</div>;
    if (error) return <div>Error: {error}</div>;
    if (!pokemon) return <div>No se encontró el Pokémon</div>;

    return (
        <div>
        <h1>{pokemon.name}</h1>
        <img src={pokemon.sprites.front_default} alt={pokemon.name} />
        <h2>Habilidades:</h2>
        <ul>
            {pokemon.abilities.map((ability, index) => (
            <li key={index}>{ability.ability.name}</li>
            ))}
        </ul>
        </div>
    );
    };
