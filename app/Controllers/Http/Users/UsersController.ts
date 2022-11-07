import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import MessagesI18n from 'App/Messages/MessagesI18n'
import Profile from 'App/Models/Users/Profile'
import Role from 'App/Models/Users/Role'
import User from 'App/Models/Users/User'
import RegisterValidator from 'App/Validators/Users/RegisterValidator'
import UpdateValidator from 'App/Validators/Users/UpdateValidator'

export default class UsersController {

  public async get({ request, response, params }: HttpContextContract) {

    const lang = new MessagesI18n(request.header('Accept-language'))

    const users = await User.query()
      .preload('profile')
      .preload('role')
      .orderBy('id', 'desc')

    if (params.id) {

      const user = users.find(e => e.id == params.id)

      return user
        ? response.ok({
          message: lang.messageC('messages.success.one', 'user'),
          status: lang.messageA('messages.SUCCESSFUL'),
          data: user
        })
        : response.notFound({
          message: lang.messageC('messages.errors.notFound', 'user'),
          status: lang.messageA('messages.FAILED'),
          data: null
        })

    }

    return response.ok({
      message: lang.messageC('messages.success.all', 'users'),
      status: lang.messageA('messages.SUCCESSFUL'),
      data: users
    })

  }

  public async create({ request, response }: HttpContextContract) {

    const lang = new MessagesI18n(request.header('Accept-language'))

    try {

      const vali = await request.validate(RegisterValidator)

      if (!vali) {
        return
      }

      const role = await Role.find(vali.role_id)

      if (!role) {
        return response.notFound({
          message: lang.messageC('messages.errors.notFound', 'role'),
          status: lang.messageA('messages.FAILED'),
          data: null
        })
      }

      const existUser = await User.findBy('email', vali.email)

      if (existUser) {
        return response.badRequest({
          messages: lang.messageA('messages.errors.exist'),
          status: lang.messageA('messages.FAILED'),
          data: null
        })
      }

      const user = await User.create(
        {
          'email': vali.email,
          'password': vali.password,
          'active': vali.active,
          'role_id': vali.role_id
        }
      )

      const profile = await Profile.create(
        {
          'user_id': user.id,
          'name': vali.name,
          'lastname': vali.lastname,
          'phone': vali.phone,
          'address': vali.address
        }
      )

      return response.created({
        message: lang.messageC('messages.success.create', 'user'),
        status: lang.messageA('messages.SUCCESSFUL'),
        data: {
          user,
          profile
        }
      })

    } catch (error) {

      console.log(error)

      return response.badRequest({
        message: lang.validationErr(error),
        status: lang.messageA('messages.FAILED'),
        data: error.messages
      })

    }

  }

  public async update({ request, response, params }: HttpContextContract) {

    const lang = new MessagesI18n(request.header('Accept-language'))

    try {

      const vali = await request.validate(UpdateValidator)

      if (!vali) {
        return
      }

      const role = await Role.find(vali.role_id)

      if (!role) {
        return response.notFound({
          message: lang.messageC('messages.errors.notFound', 'role'),
          status: lang.messageA('messages.FAILED'),
          data: null
        })
      }

      const user = await User.find(params.id)

      if (!user) {
        return response.notFound({
          message: lang.messageC('messages.errors.notFound', 'user'),
          status: lang.messageA('messages.FAILED'),
          data: null
        })
      }

      const profile = await Profile.findBy('user_id', user.id)

      if (!profile) {
        return response.notFound({
          message: lang.messageC('messages.errors.notFound', 'user'),
          status: lang.messageA('messages.FAILED'),
          data: null
        })
      }

      await user.merge(
        {
          'email': vali.email,
          'active': vali.active,
          'role_id': vali.role_id
        }
      ).save()

      await profile.merge(
        {
          'user_id': user.id,
          'name': vali.name,
          'lastname': vali.lastname,
          'phone': vali.phone,
          'address': vali.address
        }
      ).save()

      return response.ok({
        message: lang.messageC('messages.success.update', 'user'),
        status: lang.messageA('messages.SUCCESSFUL'),
        data: {
          user,
          profile
        }
      })

    } catch (error) {

      console.log(error)

      return response.badRequest({
        message: lang.validationErr(error),
        status: lang.messageA('messages.FAILED'),
        data: error.messages
      })

    }

  }

  public async delete({ request, response, params }: HttpContextContract) {

    const lang = new MessagesI18n(request.header('Accept-language'))

    const user = await User.find(params.id)

    if (!user) {
      return response.notFound({
        message: lang.messageC('messages.errors.notFound', 'user'),
        status: lang.messageA('messages.FAILED'),
        data: null
      })
    }

    await user.merge({ active: !user.active }).save()

    return response.ok({
      message: lang.messageC('messages.success.status', 'user'),
      status: lang.messageA('messages.SUCCESSFUL'),
      data: user
    })

  }
}
