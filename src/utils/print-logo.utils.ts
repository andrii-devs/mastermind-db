import kleur from 'kleur';
import figlet from 'figlet';
export async function printLogo(version: string) {
  console.log(
    kleur.cyan(
      figlet.textSync('Sequelize Blueprint CLI', {
        horizontalLayout: 'default',
        verticalLayout: 'default',
      }),
    ),
  );
  console.log(kleur.green(`Version: ${version || '1.0.0'}`));
}
