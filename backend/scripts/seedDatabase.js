import mongoose from "mongoose";
import dotenv from "dotenv";
import Genre from "../models/Genre.js";
import Movie from "../models/Movie.js";
import connectDB from "../config/database.js";

dotenv.config();

const seedDatabase = async () => {
  try {
    await connectDB();

    // Clear existing data
    await Genre.deleteMany({});
    await Movie.deleteMany({});

    // Create genres
    const genres = await Genre.create([
      { name: "Action", description: "High-octane action films" },
      { name: "Comedy", description: "Funny and entertaining movies" },
      { name: "Drama", description: "Emotional and compelling stories" },
      { name: "Sci-Fi", description: "Science fiction and futuristic tales" },
      { name: "Horror", description: "Scary and thrilling movies" },
      { name: "Documentary", description: "Factual and educational content" },
      { name: "Adventure", description: "Exciting adventure stories" },
      { name: "Romance", description: "Love stories and romantic tales" },
    ]);

    // Create movies
    const movies = await Movie.create([
      {
        title: "Shang-Chi and the Legend of the Ten Rings",
        description:
          "Shang-Chi must confront the past he thought he left behind when he is drawn into the web of the mysterious Ten Rings organization.",
        imageUrl: "/movies/shangchi.webp",
        genres: [genres[0]._id],
        year: 2022,
        rating: 8.9,
        duration: 132,
        director: "Destin Daniel Cretton",
        cast: ["Simu Liu", "Awkwafina", "Tony Leung"],
        contentRating: "TV-MA",
        featured: true,
        trending: true,
        popular: true,
        seasons: 2,
        tags: ["Action", "Adventure", "Sci-Fi"],
      },
      {
        title: "Gladiator II",
        description:
          "A sequel to the epic historical drama following the journey of a new hero in ancient Rome.",
        imageUrl:
          "https://www.themoviedb.org/t/p/w1280/2cxhvwyEwRlysAmRH4iodkvo0z5.jpg",
        genres: [genres[0]._id, genres[2]._id],
        year: 2024,
        rating: 8.2,
        duration: 156,
        director: "Ridley Scott",
        cast: ["Paul Mescal", "Denzel Washington"],
        contentRating: "R",
        trending: true,
        tags: ["Action", "Drama", "Historical"],
      },
      {
        title: "Captain America",
        description: "The first Avenger rises to save the world.",
        imageUrl: "/movies/captAmerica.webp",
        genres: [genres[0]._id, genres[3]._id],
        year: 2011,
        rating: 7.9,
        duration: 124,
        popular: true,
        tags: ["Action", "Sci-Fi"],
      },
      {
        title: "Avatar",
        description:
          "A paraplegic Marine dispatched to the moon Pandora on a unique mission.",
        imageUrl: "/movies/avatar.webp",
        genres: [genres[3]._id, genres[6]._id],
        year: 2009,
        rating: 7.8,
        duration: 162,
        popular: true,
        trending: true,
        tags: ["Sci-Fi", "Adventure", "Fantasy"],
      },
      {
        title: "Oppenheimer",
        description:
          "The story of J. Robert Oppenheimer and the development of the atomic bomb.",
        imageUrl: "/movies/oppenheimer.webp",
        genres: [genres[2]._id],
        year: 2023,
        rating: 8.3,
        duration: 180,
        popular: true,
        featured: true,
        tags: ["Drama", "History", "Biography"],
      },
      {
        title: "The Godfather",
        description:
          "The aging patriarch of an organized crime dynasty transfers control of his clandestine empire to his youngest son.",
        imageUrl: "/movies/godfather.webp",
        genres: [genres[2]._id],
        year: 1972,
        rating: 9.2,
        duration: 175,
        popular: true,
        trending: true,
        tags: ["Drama", "Crime"],
      },
      {
        title: "Wakanda Forever",
        description: "The kingdom of Wakanda faces a new threat.",
        imageUrl: "/movies/wakanda.webp",
        genres: [genres[0]._id, genres[3]._id],
        year: 2022,
        rating: 7.3,
        duration: 161,
        popular: true,
        tags: ["Action", "Sci-Fi", "Adventure"],
      },
      {
        title: "300",
        description:
          "King Leonidas of Sparta and a force of 300 men fight the invading Persian army.",
        imageUrl: "/movies/300.webp",
        genres: [genres[0]._id],
        year: 2007,
        rating: 7.6,
        duration: 117,
        trending: true,
        tags: ["Action", "Historical", "War"],
      },
      {
        title: "Babylon",
        description:
          "An ambitious film about the rise and fall of multiple characters during Hollywood's Golden Age.",
        imageUrl: "/movies/babylon.webp",
        genres: [genres[2]._id],
        year: 2022,
        rating: 7.4,
        duration: 189,
        tags: ["Drama", "History"],
      },
      {
        title: "Nobody",
        description: "A man discovers his talent for violence.",
        imageUrl: "/movies/nobody.webp",
        genres: [genres[0]._id],
        year: 2021,
        rating: 7.1,
        duration: 92,
        trending: true,
        tags: ["Action", "Thriller"],
      },
      {
        title: "Blade",
        description:
          "A half-vampire, half-human vampire hunter fights to end the conflict between humans and vampires.",
        imageUrl: "/movies/blade.webp",
        genres: [genres[0]._id, genres[4]._id],
        year: 1998,
        rating: 7.8,
        duration: 121,
        trending: true,
        tags: ["Action", "Horror", "Sci-Fi"],
      },
      {
        title: "The Northman",
        description:
          "A young Viking prince seeks revenge for his father's murder.",
        imageUrl: "/movies/northman.webp",
        genres: [genres[0]._id, genres[2]._id],
        year: 2022,
        rating: 7.6,
        duration: 136,
        trending: true,
        tags: ["Action", "Drama", "Historical"],
      },
      {
        title: "Killers of the Flower Moon",
        description:
          "An investigation into a series of murders of wealthy Osage Nation members.",
        imageUrl: "/movies/killers.webp",
        genres: [genres[2]._id],
        year: 2023,
        rating: 7.2,
        duration: 206,
        popular: true,
        tags: ["Drama", "Crime", "History"],
      },
      {
        title: "Thunderbolts",
        description: "A team of anti-heroes must save the world.",
        imageUrl: "/movies/thunderbolts.webp",
        genres: [genres[0]._id, genres[3]._id],
        year: 2024,
        rating: 6.9,
        duration: 130,
        trending: true,
        tags: ["Action", "Sci-Fi", "Adventure"],
      },
      {
        title: "Robinhood",
        description: "An outlaw takes from the rich to give to the poor.",
        imageUrl: "/movies/robinhood.webp",
        genres: [genres[0]._id, genres[6]._id],
        year: 2018,
        rating: 6.9,
        duration: 116,
        tags: ["Action", "Adventure", "Drama"],
      },
      {
        title: "Pirates",
        description:
          "A swashbuckling adventure following the exploits of a notorious pirate and his crew.",
        imageUrl:
          "https://www.themoviedb.org/t/p/w1280/jGWpG4YhpQwVmjyHEGkxEkeRf0S.jpg",
        genres: [genres[0]._id, genres[6]._id],
        year: 2020,
        rating: 7.0,
        duration: 139,
        trending: true,
        tags: ["Action", "Adventure", "Fantasy"],
      },
      {
        title: "Captain America: Civil War",
        description:
          "Political interference in the Avengers' activities causes a rift between former allies.",
        imageUrl:
          "https://www.themoviedb.org/t/p/w1280/rAGiXaUfPzY7CDEyNKUofk3Kw2e.jpg",
        genres: [genres[0]._id, genres[3]._id],
        year: 2016,
        rating: 7.8,
        duration: 147,
        popular: true,
        tags: ["Action", "Sci-Fi", "Adventure"],
      },
      {
        title: "Sinners",
        description: "Two men of faith must uncover the truth.",
        imageUrl: "/movies/sinners.webp",
        genres: [genres[2]._id],
        year: 2021,
        rating: 7.2,
        duration: 124,
        tags: ["Drama", "Thriller"],
      },
    ]);

    console.log("✅ Database seeded successfully!");
    console.log(`📚 ${genres.length} genres created`);
    console.log(`🎬 ${movies.length} movies created`);
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  }
};

seedDatabase();
