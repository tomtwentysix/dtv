#!/bin/bash

# dt.visuals Docker Management Script
# Provides easy management commands for both development and production environments

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

show_help() {
    echo "🎬 dt.visuals Docker Management"
    echo "=============================="
    echo ""
    echo "Usage: ./docker-management.sh [COMMAND] [ENVIRONMENT]"
    echo ""
    echo "COMMANDS:"
    echo "  start     Start the specified environment"
    echo "  stop      Stop the specified environment"
    echo "  restart   Restart the specified environment"
    echo "  logs      Show logs for the specified environment"
    echo "  status    Show status of containers"
    echo "  cleanup   Remove stopped containers and unused images"
    echo "  backup    Backup database and uploads"
    echo "  restore   Restore database and uploads from backup"
    echo "  shell     Open shell in app container"
    echo "  db-shell  Open PostgreSQL shell"
    echo "  migrate   Run database migrations"
    echo "  reset     Reset environment (removes all data)"
    echo ""
    echo "ENVIRONMENTS:"
    echo "  dev       Development environment (port 3000)"
    echo "  prod      Production environment (port 5000)"
    echo ""
    echo "EXAMPLES:"
    echo "  ./docker-management.sh start dev"
    echo "  ./docker-management.sh logs prod"
    echo "  ./docker-management.sh backup dev"
    echo "  ./docker-management.sh shell prod"
}

validate_environment() {
    if [[ "$1" != "dev" && "$1" != "prod" ]]; then
        echo "❌ Invalid environment. Use 'dev' or 'prod'"
        exit 1
    fi
}

get_compose_file() {
    if [[ "$1" == "dev" ]]; then
        echo "docker-compose.dev.yml"
    else
        echo "docker-compose.prod.yml"
    fi
}

get_app_service() {
    if [[ "$1" == "dev" ]]; then
        echo "app-dev"
    else
        echo "app-prod"
    fi
}

get_db_service() {
    if [[ "$1" == "dev" ]]; then
        echo "postgres-dev"
    else
        echo "postgres-prod"
    fi
}

start_environment() {
    local env=$1
    local compose_file=$(get_compose_file $env)
    
    echo "🚀 Starting $env environment..."
    docker-compose -f "$compose_file" up -d
    
    if [[ "$env" == "dev" ]]; then
        echo "✅ Development environment started on http://localhost:3000"
    else
        echo "✅ Production environment started on http://localhost:5000"
    fi
}

stop_environment() {
    local env=$1
    local compose_file=$(get_compose_file $env)
    
    echo "🛑 Stopping $env environment..."
    docker-compose -f "$compose_file" down
    echo "✅ $env environment stopped"
}

restart_environment() {
    local env=$1
    local compose_file=$(get_compose_file $env)
    
    echo "🔄 Restarting $env environment..."
    docker-compose -f "$compose_file" restart
    echo "✅ $env environment restarted"
}

show_logs() {
    local env=$1
    local compose_file=$(get_compose_file $env)
    
    echo "📋 Showing logs for $env environment..."
    docker-compose -f "$compose_file" logs -f
}

show_status() {
    echo "📊 Container Status:"
    echo ""
    docker ps -a --filter "name=dt-visuals" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
}

cleanup_docker() {
    echo "🧹 Cleaning up Docker resources..."
    
    # Remove stopped containers
    docker container prune -f
    
    # Remove unused images
    docker image prune -f
    
    # Remove unused volumes (be careful with this)
    echo "⚠️  Remove unused volumes? This will delete data not associated with running containers."
    read -p "Continue? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        docker volume prune -f
    fi
    
    echo "✅ Cleanup completed"
}

backup_environment() {
    local env=$1
    local timestamp=$(date +"%Y%m%d_%H%M%S")
    local backup_dir="./backups/${env}_${timestamp}"
    
    echo "💾 Backing up $env environment..."
    mkdir -p "$backup_dir"
    
    # Backup database
    local db_service=$(get_db_service $env)
    local compose_file=$(get_compose_file $env)
    
    if [[ "$env" == "dev" ]]; then
        docker-compose -f "$compose_file" exec -T "$db_service" pg_dump -U postgres dt_visuals_dev > "$backup_dir/database.sql"
    else
        docker-compose -f "$compose_file" exec -T "$db_service" pg_dump -U postgres dt_visuals_prod > "$backup_dir/database.sql"
    fi
    
    # Backup uploads
    local volume_name="dt-visuals-uploads-${env}"
    docker run --rm -v "$volume_name":/data -v "$PWD/$backup_dir":/backup alpine tar czf /backup/uploads.tar.gz -C /data .
    
    echo "✅ Backup completed: $backup_dir"
}

open_shell() {
    local env=$1
    local app_service=$(get_app_service $env)
    local compose_file=$(get_compose_file $env)
    
    echo "🐚 Opening shell in $env app container..."
    docker-compose -f "$compose_file" exec "$app_service" sh
}

open_db_shell() {
    local env=$1
    local db_service=$(get_db_service $env)
    local compose_file=$(get_compose_file $env)
    
    echo "🗄️  Opening PostgreSQL shell for $env..."
    if [[ "$env" == "dev" ]]; then
        docker-compose -f "$compose_file" exec "$db_service" psql -U postgres -d dt_visuals_dev
    else
        docker-compose -f "$compose_file" exec "$db_service" psql -U postgres -d dt_visuals_prod
    fi
}

run_migrations() {
    local env=$1
    local app_service=$(get_app_service $env)
    local compose_file=$(get_compose_file $env)
    
    echo "🗄️  Running database migrations for $env..."
    docker-compose -f "$compose_file" exec "$app_service" npm run db:push
    echo "✅ Migrations completed"
}

reset_environment() {
    local env=$1
    local compose_file=$(get_compose_file $env)
    
    echo "⚠️  WARNING: This will completely reset the $env environment!"
    echo "   - All containers will be removed"
    echo "   - All data will be lost"
    echo "   - Volumes will be deleted"
    echo ""
    read -p "Are you sure you want to continue? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Reset cancelled"
        exit 1
    fi
    
    echo "🗑️  Resetting $env environment..."
    docker-compose -f "$compose_file" down -v --remove-orphans
    docker-compose -f "$compose_file" build --no-cache
    docker-compose -f "$compose_file" up -d
    
    echo "✅ $env environment reset completed"
}

# Main script logic
if [[ $# -eq 0 ]]; then
    show_help
    exit 0
fi

COMMAND=$1
ENVIRONMENT=${2:-}

case $COMMAND in
    "help"|"-h"|"--help")
        show_help
        ;;
    "start")
        validate_environment "$ENVIRONMENT"
        start_environment "$ENVIRONMENT"
        ;;
    "stop")
        validate_environment "$ENVIRONMENT"
        stop_environment "$ENVIRONMENT"
        ;;
    "restart")
        validate_environment "$ENVIRONMENT"
        restart_environment "$ENVIRONMENT"
        ;;
    "logs")
        validate_environment "$ENVIRONMENT"
        show_logs "$ENVIRONMENT"
        ;;
    "status")
        show_status
        ;;
    "cleanup")
        cleanup_docker
        ;;
    "backup")
        validate_environment "$ENVIRONMENT"
        backup_environment "$ENVIRONMENT"
        ;;
    "shell")
        validate_environment "$ENVIRONMENT"
        open_shell "$ENVIRONMENT"
        ;;
    "db-shell")
        validate_environment "$ENVIRONMENT"
        open_db_shell "$ENVIRONMENT"
        ;;
    "migrate")
        validate_environment "$ENVIRONMENT"
        run_migrations "$ENVIRONMENT"
        ;;
    "reset")
        validate_environment "$ENVIRONMENT"
        reset_environment "$ENVIRONMENT"
        ;;
    *)
        echo "❌ Unknown command: $COMMAND"
        echo ""
        show_help
        exit 1
        ;;
esac